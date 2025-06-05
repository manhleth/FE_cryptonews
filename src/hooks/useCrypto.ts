// src/hooks/useCrypto.ts
import { useState, useEffect, useCallback } from 'react';
//import { cryptoAPI } from '@/services/cryptoApi';
import { optimizedCryptoAPI } from '@/services/optimizedCryptoApi';
interface UseCryptoReturn {
  coins: any[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void;
  connectionStatus: 'online' | 'offline' | 'limited';
}

export const useCrypto = (limit = 100): UseCryptoReturn => {
  const [coins, setCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'limited'>('online');

  const fetchCoins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('online');
      
      const data = await optimizedCryptoAPI.getTopCoins(limit);
      
      if (data && data.length > 0) {
        setCoins(data);
        setLastUpdate(new Date());
        
        // Check if using fallback data
      if (data && data.length > 0 && 'fallback' in data[0]) {
        setConnectionStatus('limited');
      }
      }
    } catch (err: any) {
      console.error('Error fetching coins:', err);
      setError(err.message);
      
      if (err.message === 'RATE_LIMITED') {
        setConnectionStatus('limited');
      } else {
        setConnectionStatus('offline');
      }
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(() => {
    fetchCoins();
  }, [fetchCoins]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  return {
    coins,
    loading,
    error,
    lastUpdate,
    refresh,
    connectionStatus
  };
};

// Hook cho coin prices với watchlist support
export const useCoinPrices = (coinIds: string[]) => {
  const [prices, setPrices] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (coinIds.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await optimizedCryptoAPI.getCoinPrices(coinIds);
      
      const pricesMap: {[key: string]: any} = {};
      data.forEach((coin: any) => {
        pricesMap[coin.id] = coin;
      });
      
      setPrices(pricesMap);
    } catch (err: any) {
      console.error('Error fetching coin prices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [coinIds]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refresh: fetchPrices
  };
};

// Hook cho single coin details
export const useCoinDetails = (coinId: string | null) => {
  const [coinDetail, setCoinDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!coinId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await optimizedCryptoAPI.getCoinDetails(coinId);
      setCoinDetail(data);
    } catch (err: any) {
      console.error('Error fetching coin details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    coinDetail,
    loading,
    error,
    refresh: fetchDetails
  };
};

// Hook cho price history
export const usePriceHistory = (coinId: string, timeRange: string) => {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!coinId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await optimizedCryptoAPI.getCoinPriceHistory(coinId, timeRange);
      
      const formattedData = data.prices?.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price
      })) || [];
      
      setPriceData(formattedData);
    } catch (err: any) {
      console.error('Error fetching price history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [coinId, timeRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    priceData,
    loading,
    error,
    refresh: fetchHistory
  };
};