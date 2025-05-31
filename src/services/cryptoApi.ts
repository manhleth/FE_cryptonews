// src/services/cryptoApi.ts
class CryptoAPIService {
  private static instance: CryptoAPIService;
  private baseURL = 'https://api.coingecko.com/api/v3';
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minRequestInterval = 1100; // 1.1 giây giữa các request
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 30000; // 30 giây
  private retryAttempts = 3;
  private retryDelay = 2000; // 2 giây

  private constructor() {}

  static getInstance(): CryptoAPIService {
    if (!CryptoAPIService.instance) {
      CryptoAPIService.instance = new CryptoAPIService();
    }
    return CryptoAPIService.instance;
  }

  // Kiểm tra cache
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // Lưu cache
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Thêm delay giữa các request
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Thực hiện request với rate limiting
  private async makeRequest<T>(url: string, cacheKey?: string): Promise<T> {
    // Kiểm tra cache trước
    if (cacheKey) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Using cached data for: ${cacheKey}`);
        return cachedData;
      }
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Đảm bảo khoảng cách tối thiểu giữa các request
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          if (timeSinceLastRequest < this.minRequestInterval) {
            await this.delay(this.minRequestInterval - timeSinceLastRequest);
          }

          console.log(`Making request to: ${url}`);
          
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CryptoApp/1.0'
            }
          });

          this.lastRequestTime = Date.now();

          if (!response.ok) {
            if (response.status === 429) {
              throw new Error('RATE_LIMITED');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          // Lưu cache
          if (cacheKey) {
            this.setCachedData(cacheKey, data);
          }

          resolve(data);
        } catch (error) {
          console.error(`Request failed for ${url}:`, error);
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  // Xử lý hàng đợi request
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

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

  // Retry logic với exponential backoff
  private async requestWithRetry<T>(
    url: string, 
    cacheKey?: string, 
    attempt = 1
  ): Promise<T> {
    try {
      return await this.makeRequest<T>(url, cacheKey);
    } catch (error: any) {
      if (attempt >= this.retryAttempts) {
        throw error;
      }

      console.log(`Retry attempt ${attempt} for ${url}`);
      
      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await this.delay(delay);
      
      return this.requestWithRetry<T>(url, cacheKey, attempt + 1);
    }
  }

  // Public methods
  async getCoinPrices(coinIds: string[]): Promise<any[]> {
    if (coinIds.length === 0) return [];
    
    const ids = coinIds.join(',');
    const url = `${this.baseURL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`;
    const cacheKey = `prices_${ids}`;
    
    try {
      return await this.requestWithRetry(url, cacheKey);
    } catch (error) {
      console.error('Failed to fetch coin prices:', error);
      return this.getFallbackPrices(coinIds);
    }
  }

  async getTopCoins(limit = 100): Promise<any[]> {
    const url = `${this.baseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    const cacheKey = `top_coins_${limit}`;
    
    try {
      return await this.requestWithRetry(url, cacheKey);
    } catch (error) {
      console.error('Failed to fetch top coins:', error);
      return this.getFallbackTopCoins();
    }
  }

  async getCoinDetails(coinId: string): Promise<any> {
    const url = `${this.baseURL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const cacheKey = `details_${coinId}`;
    
    try {
      return await this.requestWithRetry(url, cacheKey);
    } catch (error) {
      console.error(`Failed to fetch details for ${coinId}:`, error);
      throw error;
    }
  }

  async getCoinPriceHistory(coinId: string, days: string): Promise<any> {
    const url = `${this.baseURL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    const cacheKey = `history_${coinId}_${days}`;
    
    try {
      return await this.requestWithRetry(url, cacheKey);
    } catch (error) {
      console.error(`Failed to fetch price history for ${coinId}:`, error);
      throw error;
    }
  }

  // Fallback data khi API không khả dụng
  private getFallbackPrices(coinIds: string[]): any[] {
    return coinIds.map(id => ({
      id,
      symbol: id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      image: '/placeholder/32/32.jpg',
      current_price: 0,
      price_change_percentage_24h: 0,
      market_cap: 0,
      market_cap_rank: 0,
      total_volume: 0,
      last_updated: new Date().toISOString(),
      error: true
    }));
  }

  private getFallbackTopCoins(): any[] {
    const fallbackCoins = [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 43000 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 2600 },
      { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 300 },
      { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 100 },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.5 }
    ];

    return fallbackCoins.map((coin, index) => ({
      ...coin,
      image: '/placeholder/32/32.jpg',
      price_change_percentage_24h: (Math.random() - 0.5) * 10,
      market_cap: 1000000000 - (index * 100000000),
      market_cap_rank: index + 1,
      total_volume: 10000000000,
      error: true
    }));
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  // Get cache status
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const cryptoAPI = CryptoAPIService.getInstance();