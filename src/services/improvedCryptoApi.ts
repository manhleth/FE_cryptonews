// src/services/improvedCryptoApi.ts
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

interface Provider {
  name: string;
  baseURL: string;
  rateLimit: number; // ms between requests
  dailyLimit?: number;
  requestCount: number;
  lastReset: number;
}

class ImprovedCryptoAPIService {
  private static instance: ImprovedCryptoAPIService;
  
  private providers: Provider[] = [
    {
      name: 'coingecko',
      baseURL: 'https://api.coingecko.com/api/v3',
      rateLimit: 1200, // 1.2 seconds
      dailyLimit: 10000,
      requestCount: 0,
      lastReset: Date.now()
    },
    {
      name: 'coinlore',
      baseURL: 'https://api.coinlore.net/api',
      rateLimit: 100, // No strict rate limit
      requestCount: 0,
      lastReset: Date.now()
    },
    {
      name: 'cryptocompare',
      baseURL: 'https://min-api.cryptocompare.com/data',
      rateLimit: 1000,
      dailyLimit: 100000,
      requestCount: 0,
      lastReset: Date.now()
    }
  ];

  private currentProviderIndex = 0;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  private constructor() {
    // Reset daily limits at midnight
    setInterval(() => {
      const now = Date.now();
      this.providers.forEach(provider => {
        if (now - provider.lastReset > 24 * 60 * 60 * 1000) {
          provider.requestCount = 0;
          provider.lastReset = now;
        }
      });
    }, 60 * 60 * 1000); // Check every hour
  }

  static getInstance(): ImprovedCryptoAPIService {
    if (!ImprovedCryptoAPIService.instance) {
      ImprovedCryptoAPIService.instance = new ImprovedCryptoAPIService();
    }
    return ImprovedCryptoAPIService.instance;
  }

  // Enhanced caching with TTL
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`Cache hit for: ${key}`);
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Provider management
  private getNextProvider(): Provider {
    const currentProvider = this.providers[this.currentProviderIndex];
    
    // Check if current provider is available
    if (this.isProviderAvailable(currentProvider)) {
      return currentProvider;
    }

    // Find next available provider
    for (let i = 0; i < this.providers.length; i++) {
      const index = (this.currentProviderIndex + i + 1) % this.providers.length;
      const provider = this.providers[index];
      
      if (this.isProviderAvailable(provider)) {
        this.currentProviderIndex = index;
        console.log(`Switched to provider: ${provider.name}`);
        return provider;
      }
    }

    // If no provider available, return current anyway
    return currentProvider;
  }

  private isProviderAvailable(provider: Provider): boolean {
    if (provider.dailyLimit && provider.requestCount >= provider.dailyLimit) {
      return false;
    }
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generic request method with provider fallback
  private async makeRequest<T>(endpoint: string, cacheKey: string, ttl: number = 30000): Promise<T> {
    // Check cache first
    const cachedData = this.getCachedData<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        let lastError: Error | null = null;
        
        // Try each provider
        for (let attempt = 0; attempt < this.providers.length; attempt++) {
          try {
            const provider = this.getNextProvider();
            const url = this.buildURL(provider, endpoint);
            
            console.log(`Making request to ${provider.name}: ${url}`);
            
            // Rate limiting
            await this.delay(provider.rateLimit);
            
            const response = await fetch(url, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'CryptoApp/1.0'
              }
            });

            provider.requestCount++;

            if (!response.ok) {
              if (response.status === 429) {
                console.log(`Rate limited by ${provider.name}, trying next provider...`);
                this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
                continue;
              }
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const normalizedData = this.normalizeData(data, provider.name, endpoint);
            
            // Cache successful response
            this.setCachedData(cacheKey, normalizedData, ttl);
            
            resolve(normalizedData);
            return;
          } catch (error: any) {
            console.error(`Error with provider ${this.providers[this.currentProviderIndex].name}:`, error);
            lastError = error;
            this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
          }
        }

        // If all providers failed, try fallback data
        const fallbackData = this.getFallbackData(endpoint);
        if (fallbackData) {
          resolve(fallbackData);
        } else {
          reject(lastError || new Error('All providers failed'));
        }
      });

      this.processQueue();
    });
  }

  private buildURL(provider: Provider, endpoint: string): string {
    switch (provider.name) {
      case 'coingecko':
        return `${provider.baseURL}${endpoint}`;
      
      case 'coinlore':
        if (endpoint.includes('/coins/markets')) {
          return `${provider.baseURL}/tickers/?start=0&limit=100`;
        }
        if (endpoint.includes('/coins/')) {
          const coinId = endpoint.split('/coins/')[1].split('?')[0];
          return `${provider.baseURL}/ticker/?id=${this.mapCoinGeckoToCoinLore(coinId)}`;
        }
        return `${provider.baseURL}/tickers/`;
      
      case 'cryptocompare':
        if (endpoint.includes('/coins/markets')) {
          return `${provider.baseURL}/top/mktcapfull?limit=100&tsym=USD`;
        }
        return `${provider.baseURL}/price?fsym=BTC&tsyms=USD`;
      
      default:
        return `${provider.baseURL}${endpoint}`;
    }
  }

  private normalizeData(data: any, providerName: string, endpoint: string): any {
    switch (providerName) {
      case 'coingecko':
        return data; // Already in correct format
      
      case 'coinlore':
        if (Array.isArray(data)) {
          return data.map(coin => ({
            id: coin.nameid || coin.symbol?.toLowerCase(),
            symbol: coin.symbol,
            name: coin.name,
            image: `/placeholder/32/32.jpg`, // Coinlore doesn't provide images
            current_price: parseFloat(coin.price_usd || coin.price || '0'),
            price_change_percentage_24h: parseFloat(coin.percent_change_24h || '0'),
            market_cap: parseFloat(coin.market_cap_usd || '0'),
            market_cap_rank: parseInt(coin.rank || '999'),
            total_volume: 0, // Not provided by Coinlore
            last_updated: new Date().toISOString()
          }));
        }
        return data;
      
      case 'cryptocompare':
        if (data.Data) {
          return data.Data.map((item: any) => {
            const coin = item.CoinInfo;
            const market = item.RAW?.USD || item.DISPLAY?.USD || {};
            return {
              id: coin.Name.toLowerCase(),
              symbol: coin.Name,
              name: coin.FullName,
              image: `https://www.cryptocompare.com${coin.ImageUrl}`,
              current_price: market.PRICE || 0,
              price_change_percentage_24h: market.CHANGEPCT24HOUR || 0,
              market_cap: market.MKTCAP || 0,
              market_cap_rank: 999,
              total_volume: market.VOLUME24HOUR || 0,
              last_updated: new Date().toISOString()
            };
          });
        }
        return data;
      
      default:
        return data;
    }
  }

  private mapCoinGeckoToCoinLore(coinGeckoId: string): string {
    const mapping: { [key: string]: string } = {
      'bitcoin': '90',
      'ethereum': '80',
      'binancecoin': '2710',
      'solana': '48543',
      'cardano': '257',
      'avalanche-2': '28285',
      'polkadot': '6636',
      'chainlink': '1975',
      'polygon': '10462'
    };
    return mapping[coinGeckoId] || '90'; // Default to Bitcoin
  }

  private getFallbackData(endpoint: string): any {
    if (endpoint.includes('/coins/markets')) {
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
          last_updated: new Date().toISOString(),
          fallback: true
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
          last_updated: new Date().toISOString(),
          fallback: true
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
          last_updated: new Date().toISOString(),
          fallback: true
        }
      ];
    }
    return null;
  }

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

  // Public API methods
  async getTopCoins(limit = 100): Promise<CoinData[]> {
    const endpoint = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    const cacheKey = `top_coins_${limit}`;
    
    try {
      return await this.makeRequest<CoinData[]>(endpoint, cacheKey, 60000); // 1 minute cache
    } catch (error) {
      console.error('Failed to fetch top coins from all providers:', error);
      return this.getFallbackData(endpoint) || [];
    }
  }

  async getCoinPrices(coinIds: string[]): Promise<CoinData[]> {
    if (coinIds.length === 0) return [];
    
    const ids = coinIds.join(',');
    const endpoint = `/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`;
    const cacheKey = `prices_${ids}`;
    
    try {
      return await this.makeRequest<CoinData[]>(endpoint, cacheKey, 30000); // 30 seconds cache
    } catch (error) {
      console.error('Failed to fetch coin prices:', error);
      // Return individual coin fallbacks
      return coinIds.map(id => ({
        id,
        symbol: id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        image: '/placeholder/32/32.jpg',
        current_price: 0,
        price_change_percentage_24h: 0,
        market_cap: 0,
        market_cap_rank: 999,
        total_volume: 0,
        last_updated: new Date().toISOString(),
        fallback: true
      }));
    }
  }

  async getCoinDetails(coinId: string): Promise<any> {
    const endpoint = `/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const cacheKey = `details_${coinId}`;
    
    return await this.makeRequest(endpoint, cacheKey, 300000); // 5 minutes cache
  }

  async getCoinPriceHistory(coinId: string, days: string): Promise<any> {
    const endpoint = `/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    const cacheKey = `history_${coinId}_${days}`;
    
    return await this.makeRequest(endpoint, cacheKey, 600000); // 10 minutes cache
  }

  // Utility methods
  getProviderStatus(): { providers: Provider[]; currentProvider: string; cacheSize: number } {
    return {
      providers: this.providers.map(p => ({
        ...p,
        isAvailable: this.isProviderAvailable(p)
      })),
      currentProvider: this.providers[this.currentProviderIndex].name,
      cacheSize: this.cache.size
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  // Force switch provider (for testing)
  switchProvider(providerName: string): boolean {
    const index = this.providers.findIndex(p => p.name === providerName);
    if (index !== -1) {
      this.currentProviderIndex = index;
      console.log(`Manually switched to provider: ${providerName}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const improvedCryptoAPI = ImprovedCryptoAPIService.getInstance();

// Export types
export type { CoinData };