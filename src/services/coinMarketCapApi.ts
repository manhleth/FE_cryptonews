// src/services/coinMarketCapApi.ts
interface CoinMarketCapCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  num_market_pairs: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  last_updated: string;
  date_added: string;
  tags: string[];
  platform: any;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
  };
}

interface CoinMarketCapResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: CoinMarketCapCoin[];
}

interface CoinMetadata {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  logo: string;
  description: string;
  urls: {
    website: string[];
    twitter: string[];
    reddit: string[];
    facebook: string[];
    explorer: string[];
  };
}

interface CoinMetadataResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: {
    [key: string]: CoinMetadata;
  };
}

// Normalized interface cho compatibility với existing code
interface NormalizedCoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  last_updated: string;
}

class CoinMarketCapAPIService {
  private static instance: CoinMarketCapAPIService;
  private baseURL = 'https://pro-api.coinmarketcap.com/v1';
  private sandboxURL = 'https://sandbox-api.coinmarketcap.com/v1';
  private apiKey = process.env.NEXT_PUBLIC_CMC_API_KEY || process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY;
  private useSandbox = process.env.NODE_ENV === 'development';
  
  // Cache settings
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly defaultTTL = 300000; // 5 minutes
  private readonly pricesTTL = 60000; // 1 minute for prices
  private readonly metadataTTL = 3600000; // 1 hour for metadata
  
  // Rate limiting
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second between requests (safe for basic plan)
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private rateLimitRetryCount = 0;
  private readonly maxRetryAttempts = 3;

  // Symbol to ID mapping cache
  private symbolToIdMap = new Map<string, number>();
  private slugToIdMap = new Map<string, number>();

  private constructor() {
    // Clean cache every 10 minutes
    setInterval(() => this.cleanExpiredCache(), 600000);
    
    // Load initial mappings
    this.loadCoinMappings();
  }

  static getInstance(): CoinMarketCapAPIService {
    if (!CoinMarketCapAPIService.instance) {
      CoinMarketCapAPIService.instance = new CoinMarketCapAPIService();
    }
    return CoinMarketCapAPIService.instance;
  }

  private getBaseURL(): string {
    return this.useSandbox ? this.sandboxURL : this.baseURL;
  }

  // Cache management
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`🎯 CoinMarketCap Cache hit: ${key}`);
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
    console.log(`🧹 CoinMarketCap Cache cleaned. Current size: ${this.cache.size}`);
  }

  // Rate limiting
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest<T>(endpoint: string, params: URLSearchParams = new URLSearchParams(), cacheKey?: string, ttl?: number): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cachedData = this.getCachedData<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Rate limiting
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          if (timeSinceLastRequest < this.minRequestInterval) {
            await this.delay(this.minRequestInterval - timeSinceLastRequest);
          }

          const url = `${this.getBaseURL()}${endpoint}?${params.toString()}`;
          
          const headers: HeadersInit = {
            'Accept': 'application/json',
            'Accept-Encoding': 'deflate, gzip',
          };

          if (this.apiKey) {
            headers['X-CMC_PRO_API_KEY'] = this.apiKey;
            console.log(`🔑 Using CoinMarketCap API key for: ${endpoint}`);
          } else {
            console.warn('⚠️ No CoinMarketCap API key found');
            // In development, return fallback data instead of throwing error
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Development mode: returning fallback data');
              return this.getFallbackResponse(endpoint);
            }
            throw new Error('CoinMarketCap API key required');
          }

          console.log(`📡 CoinMarketCap request: ${url}`);
          
          const response = await fetch(url, { headers });
          this.lastRequestTime = Date.now();

          if (!response.ok) {
            if (response.status === 429) {
              console.error('🚫 CoinMarketCap rate limited!');
              this.rateLimitRetryCount++;
              if (this.rateLimitRetryCount < this.maxRetryAttempts) {
                await this.delay(60000); // Wait 1 minute
                return this.makeRequest(endpoint, params, cacheKey, ttl);
              }
              throw new Error('RATE_LIMITED');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.status && data.status.error_code !== 0) {
            throw new Error(`CoinMarketCap API Error ${data.status.error_code}: ${data.status.error_message}`);
          }

          // Cache the response
          if (cacheKey) {
            this.setCachedData(cacheKey, data, ttl);
          }

          this.rateLimitRetryCount = 0;
          resolve(data);
        } catch (error) {
          console.error('❌ CoinMarketCap API error:', error);
          reject(error);
        }
      });

      this.processQueue();
    });
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
          console.error('❌ Queue processing error:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  // Load coin mappings for symbol/slug to ID conversion
  private async loadCoinMappings(): Promise<void> {
    try {
      const cacheKey = 'coin_mappings';
      const cached = this.getCachedData<any>(cacheKey);
      
      if (cached) {
        this.processMappings(cached.data);
        return;
      }

      const params = new URLSearchParams({
        listing_status: 'active',
        limit: '5000'
      });

      const response = await this.makeRequest<{ data: Array<{ id: number; symbol: string; slug: string }> }>(
        '/cryptocurrency/map',
        params,
        cacheKey,
        86400000 // 24 hours cache
      );

      this.processMappings(response.data);
    } catch (error) {
      console.error('❌ Failed to load coin mappings:', error);
    }
  }

  private processMappings(mappings: Array<{ id: number; symbol: string; slug: string }>): void {
    mappings.forEach(coin => {
      this.symbolToIdMap.set(coin.symbol.toLowerCase(), coin.id);
      this.slugToIdMap.set(coin.slug, coin.id);
    });
    console.log(`📊 Loaded ${mappings.length} coin mappings`);
  }

  // Helper methods for ID conversion
  private getIdFromSymbol(symbol: string): number | null {
    return this.symbolToIdMap.get(symbol.toLowerCase()) || null;
  }

  private getIdFromSlug(slug: string): number | null {
    return this.slugToIdMap.get(slug) || null;
  }

  // Convert CoinGecko IDs to CoinMarketCap format
  private convertCoinGeckoId(coinGeckoId: string): string {
    // Common mappings from CoinGecko to CoinMarketCap
    const idMappings: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'tether': 'USDT',
      'binancecoin': 'BNB',
      'solana': 'SOL',
      'usd-coin': 'USDC',
      'xrp': 'XRP',
      'staked-ether': 'STETH',
      'dogecoin': 'DOGE',
      'cardano': 'ADA',
      'tron': 'TRX',
      'avalanche-2': 'AVAX',
      'wrapped-bitcoin': 'WBTC',
      'shiba-inu': 'SHIB',
      'chainlink': 'LINK',
      'polkadot': 'DOT',
      'bitcoin-cash': 'BCH',
      'near': 'NEAR',
      'matic-network': 'MATIC',
      'litecoin': 'LTC',
      'dai': 'DAI',
      'leo-token': 'LEO',
      'uniswap': 'UNI',
      'cosmos': 'ATOM',
      'ethereum-classic': 'ETC',
      'stellar': 'XLM',
      'monero': 'XMR',
      'okb': 'OKB',
      'filecoin': 'FIL',
      'hedera-hashgraph': 'HBAR',
      'cronos': 'CRO',
      'arbitrum': 'ARB',
      'vechain': 'VET',
      'algorand': 'ALGO',
      'optimism': 'OP',
      'internet-computer': 'ICP',
      'polygon': 'MATIC'
    };

    return idMappings[coinGeckoId] || coinGeckoId.toUpperCase();
  }

  // Main API methods
  async getTopCoins(limit: number = 100): Promise<NormalizedCoinData[]> {
    const cacheKey = `top_coins_${limit}`;
    
    try {
      const params = new URLSearchParams({
        start: '1',
        limit: limit.toString(),
        convert: 'USD',
        sort: 'market_cap',
        sort_dir: 'desc'
      });

      const response = await this.makeRequest<CoinMarketCapResponse>(
        '/cryptocurrency/listings/latest',
        params,
        cacheKey,
        this.pricesTTL
      );

      return this.normalizeCoinData(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch top coins from CoinMarketCap:', error);
      return this.getFallbackTopCoins();
    }
  }

  async getCoinPrices(coinIds: string[]): Promise<NormalizedCoinData[]> {
    if (coinIds.length === 0) return [];
    
    try {
      // Convert CoinGecko IDs to symbols for CoinMarketCap
      const symbols = coinIds.map(id => this.convertCoinGeckoId(id));
      const symbolsString = symbols.join(',');
      
      const cacheKey = `prices_${symbolsString}`;
      
      const params = new URLSearchParams({
        symbol: symbolsString,
        convert: 'USD'
      });

      const response = await this.makeRequest<CoinMarketCapResponse>(
        '/cryptocurrency/quotes/latest',
        params,
        cacheKey,
        this.pricesTTL
      );

      return this.normalizeCoinData(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch coin prices from CoinMarketCap:', error);
      return this.getFallbackPrices(coinIds);
    }
  }

  async getCoinDetails(coinId: string): Promise<any> {
    const symbol = this.convertCoinGeckoId(coinId);
    const cacheKey = `details_${symbol}`;
    
    try {
      // Get basic data
      const quotesParams = new URLSearchParams({
        symbol: symbol,
        convert: 'USD'
      });

      const [quotesResponse, metadataResponse] = await Promise.allSettled([
        this.makeRequest<CoinMarketCapResponse>(
          '/cryptocurrency/quotes/latest',
          quotesParams,
          `${cacheKey}_quotes`,
          this.defaultTTL
        ),
        this.getCoinMetadata(symbol)
      ]);

      let coinData = null;
      let metadata = null;

      if (quotesResponse.status === 'fulfilled' && quotesResponse.value.data.length > 0) {
        coinData = quotesResponse.value.data[0];
      }

      if (metadataResponse.status === 'fulfilled') {
        metadata = metadataResponse.value;
      }

      // Combine and format the data
      return this.formatCoinDetails(coinData, metadata, coinId);
    } catch (error) {
      console.error(`❌ Failed to fetch details for ${coinId}:`, error);
      throw error;
    }
  }

  private async getCoinMetadata(symbol: string): Promise<CoinMetadata | null> {
    try {
      const cmcId = this.getIdFromSymbol(symbol);
      if (!cmcId) return null;

      const params = new URLSearchParams({
        id: cmcId.toString()
      });

      const response = await this.makeRequest<CoinMetadataResponse>(
        '/cryptocurrency/info',
        params,
        `metadata_${cmcId}`,
        this.metadataTTL
      );

      return response.data[cmcId.toString()] || null;
    } catch (error) {
      console.error(`❌ Failed to fetch metadata for ${symbol}:`, error);
      return null;
    }
  }

  // Normalize CoinMarketCap data to match CoinGecko format
  private normalizeCoinData(coins: CoinMarketCapCoin[]): NormalizedCoinData[] {
    return coins.map(coin => ({
      id: coin.slug,
      symbol: coin.symbol.toLowerCase(),
      name: coin.name,
      image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
      current_price: coin.quote.USD.price,
      price_change_percentage_24h: coin.quote.USD.percent_change_24h,
      price_change_percentage_7d: coin.quote.USD.percent_change_7d,
      market_cap: coin.quote.USD.market_cap,
      market_cap_rank: coin.cmc_rank,
      total_volume: coin.quote.USD.volume_24h,
      last_updated: coin.quote.USD.last_updated
    }));
  }

  private formatCoinDetails(coinData: CoinMarketCapCoin | null, metadata: CoinMetadata | null, originalId: string): any {
    if (!coinData) {
      throw new Error('Coin data not found');
    }

    return {
      id: originalId,
      symbol: coinData.symbol.toLowerCase(),
      name: coinData.name,
      image: {
        large: metadata?.logo || `https://s2.coinmarketcap.com/static/img/coins/200x200/${coinData.id}.png`
      },
      description: {
        en: metadata?.description || 'No description available'
      },
      links: {
        homepage: metadata?.urls.website || [],
        blockchain_site: metadata?.urls.explorer || []
      },
      market_data: {
        current_price: {
          usd: coinData.quote.USD.price
        },
        price_change_percentage_24h: coinData.quote.USD.percent_change_24h,
        price_change_percentage_7d: coinData.quote.USD.percent_change_7d,
        price_change_percentage_30d: coinData.quote.USD.percent_change_30d,
        market_cap: {
          usd: coinData.quote.USD.market_cap
        },
        total_volume: {
          usd: coinData.quote.USD.volume_24h
        },
        circulating_supply: coinData.circulating_supply,
        total_supply: coinData.total_supply,
        max_supply: coinData.max_supply,
        market_cap_rank: coinData.cmc_rank,
        ath: {
          usd: coinData.quote.USD.price // CoinMarketCap doesn't provide ATH directly
        },
        atl: {
          usd: coinData.quote.USD.price // CoinMarketCap doesn't provide ATL directly
        }
      }
    };
  }

  // Fallback methods
  private getFallbackTopCoins(): NormalizedCoinData[] {
    return [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
        current_price: 50000,
        price_change_percentage_24h: 0,
        price_change_percentage_7d: 0,
        market_cap: 1000000000000,
        market_cap_rank: 1,
        total_volume: 20000000000,
        last_updated: new Date().toISOString()
      }
    ];
  }

  private getFallbackPrices(coinIds: string[]): NormalizedCoinData[] {
    return coinIds.map((id, index) => ({
      id,
      symbol: id.substring(0, 3).toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      image: '/placeholder/64/64.jpg',
      current_price: 0,
      price_change_percentage_24h: 0,
      price_change_percentage_7d: 0,
      market_cap: 0,
      market_cap_rank: index + 1,
      total_volume: 0,
      last_updated: new Date().toISOString()
    }));
  }

  // Fallback response for development mode
  private getFallbackResponse(endpoint: string): any {
    if (endpoint.includes('/cryptocurrency/listings/latest')) {
      return {
        status: { error_code: 0 },
        data: this.getFallbackTopCoins().map(coin => ({
          id: 1,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          slug: coin.id,
          cmc_rank: coin.market_cap_rank,
          circulating_supply: 19000000,
          total_supply: 21000000,
          max_supply: 21000000,
          quote: {
            USD: {
              price: coin.current_price,
              volume_24h: coin.total_volume,
              percent_change_24h: coin.price_change_percentage_24h,
              percent_change_7d: coin.price_change_percentage_7d,
              percent_change_30d: 0,
              market_cap: coin.market_cap,
              last_updated: coin.last_updated
            }
          }
        }))
      };
    }
    
    if (endpoint.includes('/cryptocurrency/quotes/latest')) {
      return {
        status: { error_code: 0 },
        data: this.getFallbackTopCoins().slice(0, 5).map(coin => ({
          id: 1,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          slug: coin.id,
          cmc_rank: coin.market_cap_rank,
          quote: {
            USD: {
              price: coin.current_price,
              volume_24h: coin.total_volume,
              percent_change_24h: coin.price_change_percentage_24h,
              percent_change_7d: coin.price_change_percentage_7d,
              percent_change_30d: 0,
              market_cap: coin.market_cap,
              last_updated: coin.last_updated
            }
          }
        }))
      };
    }
    
    // Default fallback
    return {
      status: { error_code: 0 },
      data: []
    };
  }
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Method to clear cache manually
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 CoinMarketCap cache cleared');
  }
}

// Export singleton instance
export const coinMarketCapAPI = CoinMarketCapAPIService.getInstance();
export type { NormalizedCoinData };