// src/services/optimizedCryptoApi.ts
interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  last_updated: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class OptimizedCryptoAPIService {
  private static instance: OptimizedCryptoAPIService;
  private baseURL = 'https://api.coingecko.com/api/v3';
  
  // Cache settings
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 120000; // 2 minutes
  private readonly pricesTTL = 60000; // 1 minute for prices
  private readonly topCoinsTTL = 300000; // 5 minutes for top coins
  
  // Rate limiting
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1500; // 1.5 seconds between requests
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private rateLimitRetryCount = 0;
  private readonly maxRetryAttempts = 3;

  // Request batching
  private pendingPriceRequests = new Map<string, Promise<any>>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchedCoinIds = new Set<string>();

  private constructor() {
    // Clean cache every 5 minutes
    setInterval(() => this.cleanExpiredCache(), 300000);
  }

  static getInstance(): OptimizedCryptoAPIService {
    if (!OptimizedCryptoAPIService.instance) {
      OptimizedCryptoAPIService.instance = new OptimizedCryptoAPIService();
    }
    return OptimizedCryptoAPIService.instance;
  }

  // Cache management
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`Cache hit: ${key}`);
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    console.log(`Cache cleaned. Current size: ${this.cache.size}`);
  }

  // Rate limiting and request management
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(url: string, cacheKey?: string, ttl?: number): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cached = this.getCachedData<T>(cacheKey);
      if (cached) return cached;
    }

    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Rate limiting
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          if (timeSinceLastRequest < this.minRequestInterval) {
            await this.delay(this.minRequestInterval - timeSinceLastRequest);
          }

          console.log(`Making request: ${url}`);
          
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CryptoApp/2.0'
            }
          });

          this.lastRequestTime = Date.now();

          if (!response.ok) {
            if (response.status === 429) {
              this.rateLimitRetryCount++;
              const delay = Math.min(1000 * Math.pow(2, this.rateLimitRetryCount), 30000);
              console.warn(`Rate limited. Retrying in ${delay}ms`);
              
              await this.delay(delay);
              
              if (this.rateLimitRetryCount < this.maxRetryAttempts) {
                return this.makeRequest<T>(url, cacheKey, ttl);
              }
              throw new Error('RATE_LIMITED');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          this.rateLimitRetryCount = 0;
          const data = await response.json();
          
          // Cache successful response
          if (cacheKey) {
            this.setCachedData(cacheKey, data, ttl);
          }

          resolve(data);
        } catch (error) {
          console.error(`Request failed: ${url}`, error);
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  // Batch price requests
  private batchPriceRequest(coinIds: string[]): Promise<CoinData[]> {
    coinIds.forEach(id => this.batchedCoinIds.add(id));
    
    const batchKey = Array.from(this.batchedCoinIds).sort().join(',');
    
    if (this.pendingPriceRequests.has(batchKey)) {
      return this.pendingPriceRequests.get(batchKey)!;
    }

    const promise = new Promise<CoinData[]>((resolve, reject) => {
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(async () => {
        try {
          const allCoinIds = Array.from(this.batchedCoinIds);
          const idsString = allCoinIds.join(',');
          const cacheKey = `prices_${idsString}`;
          
          const data = await this.makeRequest<CoinData[]>(
            `${this.baseURL}/coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`,
            cacheKey,
            this.pricesTTL
          );
          
          this.batchedCoinIds.clear();
          this.pendingPriceRequests.clear();
          resolve(data);
        } catch (error) {
          this.batchedCoinIds.clear();
          this.pendingPriceRequests.clear();
          reject(error);
        }
      }, 100); // Batch requests for 100ms
    });

    this.pendingPriceRequests.set(batchKey, promise);
    return promise;
  }

  // Public API methods
  async getTopCoins(limit = 100): Promise<CoinData[]> {
    const cacheKey = `top_coins_${limit}`;
    
    try {
      return await this.makeRequest<CoinData[]>(
        `${this.baseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
        cacheKey,
        this.topCoinsTTL
      );
    } catch (error) {
      console.error('Failed to fetch top coins:', error);
      return this.getFallbackTopCoins();
    }
  }

  async getCoinPrices(coinIds: string[]): Promise<CoinData[]> {
    if (coinIds.length === 0) return [];
    
    try {
      // Use batching for multiple coins
      if (coinIds.length > 5) {
        return await this.batchPriceRequest(coinIds);
      } else {
        // Direct request for small requests
        const idsString = coinIds.join(',');
        const cacheKey = `prices_${idsString}`;
        
        return await this.makeRequest<CoinData[]>(
          `${this.baseURL}/coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`,
          cacheKey,
          this.pricesTTL
        );
      }
    } catch (error) {
      console.error('Failed to fetch coin prices:', error);
      return this.getFallbackPrices(coinIds);
    }
  }

  async getCoinDetails(coinId: string): Promise<any> {
    const cacheKey = `details_${coinId}`;
    
    try {
      return await this.makeRequest(
        `${this.baseURL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
        cacheKey,
        this.defaultTTL * 5 // 10 minutes for details
      );
    } catch (error) {
      console.error(`Failed to fetch details for ${coinId}:`, error);
      throw error;
    }
  }

  async getCoinPriceHistory(coinId: string, days: string): Promise<any> {
    const cacheKey = `history_${coinId}_${days}`;
    
    try {
      return await this.makeRequest(
        `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
        cacheKey,
        this.defaultTTL * 10 // 20 minutes for history
      );
    } catch (error) {
      console.error(`Failed to fetch price history for ${coinId}:`, error);
      throw error;
    }
  }

  // Fallback data
  private getFallbackTopCoins(): CoinData[] {
    return [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: '/placeholder/32/32.jpg',
        current_price: 43000,
        price_change_percentage_24h: 2.5,
        market_cap: 850000000000,
        market_cap_rank: 1,
        total_volume: 25000000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        image: '/placeholder/32/32.jpg',
        current_price: 2600,
        price_change_percentage_24h: -1.2,
        market_cap: 320000000000,
        market_cap_rank: 2,
        total_volume: 15000000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'binancecoin',
        symbol: 'bnb',
        name: 'BNB',
        image: '/placeholder/32/32.jpg',
        current_price: 300,
        price_change_percentage_24h: 0.8,
        market_cap: 45000000000,
        market_cap_rank: 3,
        total_volume: 1500000000,
        last_updated: new Date().toISOString()
      }
    ];
  }

  private getFallbackPrices(coinIds: string[]): CoinData[] {
    return coinIds.map((id, index) => ({
      id,
      symbol: id.substring(0, 3),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      image: '/placeholder/32/32.jpg',
      current_price: Math.random() * 1000,
      price_change_percentage_24h: (Math.random() - 0.5) * 10,
      market_cap: Math.random() * 1000000000,
      market_cap_rank: index + 1,
      total_volume: Math.random() * 100000000,
      last_updated: new Date().toISOString()
    }));
  }

  // Utility methods
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.pendingPriceRequests.clear();
    this.batchedCoinIds.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    console.log('All caches cleared');
  }

  // Get status for debugging
  getStatus(): {
    cacheSize: number;
    queueLength: number;
    rateLimitRetries: number;
    isProcessing: boolean;
    pendingBatches: number;
  } {
    return {
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      rateLimitRetries: this.rateLimitRetryCount,
      isProcessing: this.isProcessing,
      pendingBatches: this.pendingPriceRequests.size
    };
  }
}

// Export singleton instance
export const optimizedCryptoAPI = OptimizedCryptoAPIService.getInstance();

// Export types
export type { CoinData };