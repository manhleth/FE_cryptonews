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
  private readonly defaultTTL = 180000; // 3 minutes
  private readonly pricesTTL = 120000; // 2 minutes for prices
  private readonly topCoinsTTL = 600000; // 10 minutes for top coins
  
  // Rate limiting - more conservative
  private lastRequestTime = 0;
  private readonly minRequestInterval = 3000; // 3 seconds between requests (safe for 20 calls/min)
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private rateLimitRetryCount = 0;
  private readonly maxRetryAttempts = 2; // Reduced retry attempts
  private readonly baseRetryDelay = 5000; // 5 seconds base delay

  // Circuit breaker pattern
  private consecutiveFailures = 0;
  private readonly maxConsecutiveFailures = 3;
  private circuitBreakerTimeout: NodeJS.Timeout | null = null;
  private isCircuitBreakerOpen = false;

  private constructor() {
    // Clean cache every 10 minutes
    setInterval(() => this.cleanExpiredCache(), 600000);
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
      console.log(`✅ Cache hit: ${key}`);
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
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    console.log(`🧹 Cache cleaned: ${cleaned} entries removed. Current size: ${this.cache.size}`);
  }

  // Circuit breaker
  private openCircuitBreaker(): void {
    console.warn('🔴 Circuit breaker opened due to consecutive failures');
    this.isCircuitBreakerOpen = true;
    
    if (this.circuitBreakerTimeout) {
      clearTimeout(this.circuitBreakerTimeout);
    }
    
    // Reset circuit breaker after 5 minutes
    this.circuitBreakerTimeout = setTimeout(() => {
      this.isCircuitBreakerOpen = false;
      this.consecutiveFailures = 0;
      console.log('🟢 Circuit breaker reset');
    }, 300000);
  }

  // Rate limiting and request management
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(url: string, cacheKey?: string, ttl?: number): Promise<T> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen) {
      console.warn('⚠️ Circuit breaker is open, using fallback data');
      throw new Error('CIRCUIT_BREAKER_OPEN');
    }

    // Check cache first
    if (cacheKey) {
      const cached = this.getCachedData<T>(cacheKey);
      if (cached) return cached;
    }

    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Rate limiting with jitter
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          const requiredDelay = this.minRequestInterval + Math.random() * 1000;
          
          if (timeSinceLastRequest < requiredDelay) {
            const waitTime = requiredDelay - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${waitTime.toFixed(0)}ms`);
            await this.delay(waitTime);
          }

          console.log(`📡 Making request: ${url}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduce to 10 seconds
          
          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'http://localhost:3000',
                'Referer': 'http://localhost:3000'
              },
              mode: 'cors',
              cache: 'no-cache',
              signal: controller.signal
            });

            clearTimeout(timeoutId);
            this.lastRequestTime = Date.now();

            if (!response.ok) {
              if (response.status === 429) {
                this.rateLimitRetryCount++;
                const delay = this.baseRetryDelay * Math.pow(2, this.rateLimitRetryCount - 1);
                console.warn(`🚫 Rate limited (${response.status}). Retry ${this.rateLimitRetryCount}/${this.maxRetryAttempts} in ${delay}ms`);
                
                if (this.rateLimitRetryCount <= this.maxRetryAttempts) {
                  await this.delay(delay);
                  return this.makeRequest<T>(url, cacheKey, ttl);
                } else {
                  this.consecutiveFailures++;
                  if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                    this.openCircuitBreaker();
                  }
                  throw new Error('RATE_LIMITED');
                }
              }
              
              // Handle other HTTP errors
              this.consecutiveFailures++;
              if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                this.openCircuitBreaker();
              }
              throw new Error(`HTTP_ERROR_${response.status}`);
            }

            // Reset on successful request
            this.rateLimitRetryCount = 0;
            this.consecutiveFailures = 0;
            
            const data = await response.json();
            
            // Validate data
            if (!data) {
              throw new Error('EMPTY_RESPONSE');
            }
            
            // Cache successful response
            if (cacheKey) {
              this.setCachedData(cacheKey, data, ttl);
            }

            console.log(`✅ Request successful: ${url}`);
            resolve(data);
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
              console.error('❌ Request timeout');
              throw new Error('REQUEST_TIMEOUT');
            } else if (fetchError.message?.includes('Failed to fetch')) {
              console.error('❌ Network error or CORS issue');
              throw new Error('NETWORK_ERROR');
            } else {
              throw fetchError;
            }
          }
        } catch (error: any) {
          console.error(`❌ Request failed: ${url}`, error.message);
          this.consecutiveFailures++;
          
          if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
            this.openCircuitBreaker();
          }
          
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;
    console.log(`🔄 Processing queue: ${this.requestQueue.length} requests`);

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

  // Public API methods with enhanced error handling
  async getTopCoins(limit = 100): Promise<CoinData[]> {
    const cacheKey = `top_coins_${limit}`;
    
    try {
      return await this.makeRequest<CoinData[]>(
        `${this.baseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
        cacheKey,
        this.topCoinsTTL
      );
    } catch (error: any) {
      console.error('❌ Failed to fetch top coins:', error.message);
      const fallbackData = this.getFallbackTopCoins();
      
      // Cache fallback data temporarily
      this.setCachedData(cacheKey, fallbackData, 30000);
      
      return fallbackData;
    }
  }

  async getCoinPrices(coinIds: string[]): Promise<CoinData[]> {
    if (coinIds.length === 0) return [];
    
    try {
      const idsString = coinIds.join(',');
      const cacheKey = `prices_${idsString}`;
      
      return await this.makeRequest<CoinData[]>(
        `${this.baseURL}/coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`,
        cacheKey,
        this.pricesTTL
      );
    } catch (error: any) {
      console.error('❌ Failed to fetch coin prices:', error.message);
      const fallbackData = this.getFallbackPrices(coinIds);
      
      // Cache fallback data temporarily
      const idsString = coinIds.join(',');
      const cacheKey = `prices_${idsString}`;
      this.setCachedData(cacheKey, fallbackData, 30000);
      
      return fallbackData;
    }
  }

  async getCoinDetails(coinId: string): Promise<any> {
    const cacheKey = `details_${coinId}`;
    
    try {
      return await this.makeRequest(
        `${this.baseURL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
        cacheKey,
        this.defaultTTL * 2
      );
    } catch (error: any) {
      console.error(`❌ Failed to fetch details for ${coinId}:`, error.message);
      
      // Always return fallback data instead of throwing
      const fallbackData = this.getFallbackCoinDetail(coinId);
      
      // Cache fallback data temporarily
      this.setCachedData(cacheKey, fallbackData, 30000); // 30 seconds cache for fallback
      
      return fallbackData;
    }
  }

  async getCoinPriceHistory(coinId: string, days: string): Promise<any> {
    const cacheKey = `history_${coinId}_${days}`;
    
    try {
      return await this.makeRequest(
        `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
        cacheKey,
        this.defaultTTL * 3
      );
    } catch (error: any) {
      console.error(`❌ Failed to fetch price history for ${coinId}:`, error.message);
      
      // Always return fallback data instead of throwing
      const fallbackData = this.getFallbackPriceHistory(coinId, days);
      
      // Cache fallback data temporarily
      this.setCachedData(cacheKey, fallbackData, 30000); // 30 seconds cache for fallback
      
      return fallbackData;
    }
  }

  // Enhanced fallback data
  private getFallbackTopCoins(): CoinData[] {
    console.log('🔄 Using fallback data for top coins');
    return [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
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
        image: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png',
        current_price: 2600,
        price_change_percentage_24h: -1.2,
        market_cap: 320000000000,
        market_cap_rank: 2,
        total_volume: 15000000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'tether',
        symbol: 'usdt',
        name: 'Tether',
        image: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png',
        current_price: 1.0,
        price_change_percentage_24h: 0.1,
        market_cap: 95000000000,
        market_cap_rank: 3,
        total_volume: 45000000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'binancecoin',
        symbol: 'bnb',
        name: 'BNB',
        image: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
        current_price: 300,
        price_change_percentage_24h: 0.8,
        market_cap: 45000000000,
        market_cap_rank: 4,
        total_volume: 1500000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'solana',
        symbol: 'sol',
        name: 'Solana',
        image: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png',
        current_price: 100,
        price_change_percentage_24h: 3.2,
        market_cap: 42000000000,
        market_cap_rank: 5,
        total_volume: 2500000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'cardano',
        symbol: 'ada',
        name: 'Cardano',
        image: 'https://coin-images.coingecko.com/coins/images/975/large/cardano.png',
        current_price: 0.5,
        price_change_percentage_24h: 1.8,
        market_cap: 17000000000,
        market_cap_rank: 6,
        total_volume: 400000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'avalanche-2',
        symbol: 'avax',
        name: 'Avalanche',
        image: 'https://coin-images.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
        current_price: 35,
        price_change_percentage_24h: -0.5,
        market_cap: 13000000000,
        market_cap_rank: 7,
        total_volume: 300000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'chainlink',
        symbol: 'link',
        name: 'Chainlink',
        image: 'https://coin-images.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
        current_price: 15,
        price_change_percentage_24h: 4.2,
        market_cap: 8500000000,
        market_cap_rank: 8,
        total_volume: 500000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'polygon',
        symbol: 'matic',
        name: 'Polygon',
        image: 'https://coin-images.coingecko.com/coins/images/4713/large/matic-token-icon.png',
        current_price: 0.8,
        price_change_percentage_24h: 2.1,
        market_cap: 7500000000,
        market_cap_rank: 9,
        total_volume: 350000000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'dogecoin',
        symbol: 'doge',
        name: 'Dogecoin',
        image: 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png',
        current_price: 0.08,
        price_change_percentage_24h: -1.5,
        market_cap: 11000000000,
        market_cap_rank: 10,
        total_volume: 800000000,
        last_updated: new Date().toISOString()
      }
    ];
  }

  private getFallbackPrices(coinIds: string[]): CoinData[] {
    console.log(`🔄 Using fallback data for ${coinIds.length} coins`);
    const fallbackMap: { [key: string]: Partial<CoinData> } = {
      'bitcoin': { current_price: 43000, price_change_percentage_24h: 2.5, market_cap_rank: 1 },
      'ethereum': { current_price: 2600, price_change_percentage_24h: -1.2, market_cap_rank: 2 },
      'tether': { current_price: 1.0, price_change_percentage_24h: 0.1, market_cap_rank: 3 },
      'binancecoin': { current_price: 300, price_change_percentage_24h: 0.8, market_cap_rank: 4 },
      'solana': { current_price: 100, price_change_percentage_24h: 3.2, market_cap_rank: 5 }
    };

    return coinIds.map((id, index) => ({
      id,
      symbol: id.substring(0, 3).toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      image: `https://coin-images.coingecko.com/coins/images/1/large/${id}.png`,
      current_price: fallbackMap[id]?.current_price || Math.random() * 1000,
      price_change_percentage_24h: fallbackMap[id]?.price_change_percentage_24h || (Math.random() - 0.5) * 10,
      market_cap: (fallbackMap[id]?.current_price || Math.random() * 1000) * 1000000,
      market_cap_rank: fallbackMap[id]?.market_cap_rank || index + 1,
      total_volume: Math.random() * 100000000,
      last_updated: new Date().toISOString()
    }));
  }

  private getFallbackCoinDetail(coinId: string): any {
    console.log(`🔄 Using fallback data for coin detail: ${coinId}`);
    
    const fallbackPrices: { [key: string]: number } = {
      'bitcoin': 43000,
      'ethereum': 2600,
      'binancecoin': 300,
      'solana': 100,
      'cardano': 0.5,
      'avalanche-2': 35,
      'chainlink': 15,
      'polygon': 0.8,
      'dogecoin': 0.08
    };
    
    const basePrice = fallbackPrices[coinId] || Math.random() * 1000;
    
    return {
      id: coinId,
      symbol: coinId.substring(0, 3).toUpperCase(),
      name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
      image: {
        large: `https://coin-images.coingecko.com/coins/images/1/large/${coinId}.png`
      },
      description: {
        en: 'Thông tin chi tiết không khả dụng do lỗi kết nối. Đây là dữ liệu demo để kiểm tra giao diện.'
      },
      links: {
        homepage: [`https://${coinId}.org`],
        blockchain_site: [`https://blockchair.com/${coinId}`]
      },
      market_data: {
        current_price: { usd: basePrice },
        price_change_percentage_24h: (Math.random() - 0.5) * 10,
        price_change_percentage_7d: (Math.random() - 0.5) * 20,
        price_change_percentage_30d: (Math.random() - 0.5) * 50,
        market_cap: { usd: basePrice * 19000000 },
        total_volume: { usd: basePrice * 1000000 },
        circulating_supply: 19000000,
        total_supply: 21000000,
        max_supply: 21000000,
        market_cap_rank: Math.floor(Math.random() * 100) + 1,
        ath: { usd: basePrice * 1.5 },
        atl: { usd: basePrice * 0.1 }
      }
    };
  }

  private getFallbackPriceHistory(coinId: string, days: string): any {
    console.log(`🔄 Using fallback data for price history: ${coinId} (${days} days)`);
    
    // Generate some dummy price data
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const basePrice = 1000 + Math.random() * 50000;
    const prices = [];
    const daysNum = parseInt(days);
    
    for (let i = daysNum; i >= 0; i--) {
      const timestamp = now - (i * dayMs);
      const volatility = 0.05; // 5% daily volatility
      const change = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + change * (daysNum - i) / daysNum);
      prices.push([timestamp, Math.max(price, basePrice * 0.5)]);
    }
    
    return { prices };
  }

  // Utility methods
  getCacheStats(): { size: number; entries: string[]; hitRate: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      hitRate: 0 // Could implement hit rate tracking
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 All caches cleared');
  }

  // Get comprehensive status for debugging
  getStatus(): {
    cacheSize: number;
    queueLength: number;
    rateLimitRetries: number;
    isProcessing: boolean;
    consecutiveFailures: number;
    isCircuitBreakerOpen: boolean;
    lastRequestTime: number;
  } {
    return {
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      rateLimitRetries: this.rateLimitRetryCount,
      isProcessing: this.isProcessing,
      consecutiveFailures: this.consecutiveFailures,
      isCircuitBreakerOpen: this.isCircuitBreakerOpen,
      lastRequestTime: this.lastRequestTime
    };
  }

  // Force reset for testing
  reset(): void {
    this.clearCache();
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitRetryCount = 0;
    this.consecutiveFailures = 0;
    this.isCircuitBreakerOpen = false;
    if (this.circuitBreakerTimeout) {
      clearTimeout(this.circuitBreakerTimeout);
      this.circuitBreakerTimeout = null;
    }
    console.log('🔄 Service reset complete');
  }
}

// Export singleton instance
export const optimizedCryptoAPI = OptimizedCryptoAPIService.getInstance();

// Export types
export type { CoinData };