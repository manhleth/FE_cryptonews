// src/components/sections/news/CryptoTicker.tsx
"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { cryptoAPI } from "@/services/cryptoApi";

interface CryptoPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
  icon: string;
  id: string;
}

interface Exchange {
  id: string;
  name: string;
  image: string;
  volume?: number;
}

export const CryptoTicker = () => {
  const [prices, setPrices] = useState<CryptoPrice[] | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'limited'>('online');
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  useEffect(() => {
    setIsClient(true);

    const fetchPrices = async () => {
      try {
        setConnectionStatus('online');
        
        // Lấy top 10 coins từ crypto API service
        const data = await cryptoAPI.getTopCoins(10);

        if (data && data.length > 0) {
          const updatedPrices: CryptoPrice[] = data.map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change: coin.price_change_percentage_24h || 0,
            icon: coin.image,
          }));

          setPrices(updatedPrices);
          setRetryCount(0);
          
          // Check if using fallback data
          if (data[0]?.error) {
            setConnectionStatus('limited');
          }
        } else {
          throw new Error('No data received');
        }
      } catch (error: any) {
        console.error("Lỗi khi lấy dữ liệu crypto:", error);
        setRetryCount(prev => prev + 1);
        
        if (error.message === 'RATE_LIMITED') {
          setConnectionStatus('limited');
        } else if (retryCount < maxRetries) {
          setConnectionStatus('limited');
          // Retry với delay
          setTimeout(() => {
            fetchPrices();
          }, Math.pow(2, retryCount) * 2000);
        } else {
          setConnectionStatus('offline');
          // Fallback to static data
          setPrices(getFallbackPrices());
        }
      }
    };

    const fetchExchanges = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/exchanges");
        
        if (!response.ok) {
          throw new Error('Failed to fetch exchanges');
        }
        
        const data = await response.json();
        const exchangeData: Exchange[] = data.slice(0, 5).map((exchange: any) => ({
          id: exchange.id,
          name: exchange.name,
          image: exchange.image,
          volume: exchange.trade_volume_24h_btc ?? 0,
        }));

        setExchanges(exchangeData);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu sàn giao dịch:", error);
        // Fallback to static exchanges
        setExchanges(getFallbackExchanges());
      }
    };

    // Fetch dữ liệu ban đầu
    fetchPrices();
    fetchExchanges();
    
    // Auto refresh với interval dài hơn để tránh rate limit
    const interval = setInterval(() => {
      if (connectionStatus !== 'offline') {
        fetchPrices();
      }
    }, 120000); // 2 phút thay vì 1 phút

    return () => clearInterval(interval);
  }, [connectionStatus, retryCount, maxRetries]);

  // Fallback data cho crypto prices
  const getFallbackPrices = (): CryptoPrice[] => {
    return [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        price: 43000,
        change: 2.5,
        icon: '/placeholder/32/32.jpg'
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        price: 2600,
        change: -1.2,
        icon: '/placeholder/32/32.jpg'
      },
      {
        id: 'binancecoin',
        name: 'BNB',
        symbol: 'BNB',
        price: 300,
        change: 0.8,
        icon: '/placeholder/32/32.jpg'
      }
    ];
  };

  // Fallback data cho exchanges
  const getFallbackExchanges = (): Exchange[] => {
    return [
      { id: 'binance', name: 'Binance', image: '/placeholder/32/32.jpg', volume: 45000 },
      { id: 'coinbase', name: 'Coinbase', image: '/placeholder/32/32.jpg', volume: 12000 },
      { id: 'kraken', name: 'Kraken', image: '/placeholder/32/32.jpg', volume: 8000 }
    ];
  };

  // Status indicator component
  const StatusIndicator = () => {
    switch (connectionStatus) {
      case 'online':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <Wifi className="h-3 w-3" />
            <span className="text-xs">Live</span>
          </div>
        );
      case 'limited':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-xs">Limited</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <WifiOff className="h-3 w-3" />
            <span className="text-xs">Offline</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isClient) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Status và Crypto Ticker */}
      <div className="relative flex overflow-x-hidden h-12 items-center">
        {/* Status indicator */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <StatusIndicator />
        </div>

        {/* Scrolling crypto data */}
        <div className="absolute top-0 animate-marquee whitespace-nowrap flex ml-20">
          {prices ? (
            prices.map((crypto, index) => (
              <span key={index} className="mx-6 text-sm font-medium flex items-center">
                <img 
                  src={crypto.icon} 
                  alt={crypto.name} 
                  className="w-5 h-5 mr-2"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder/20/20.jpg';
                  }}
                />
                {crypto.name} ({crypto.symbol})
                <span className="mx-1">${crypto.price.toFixed(2)}</span>
                <span className={`flex items-center ${crypto.change > 0 ? "text-green-500" : "text-red-500"}`}>
                  {crypto.change > 0 ? "↗" : "↘"}
                  {Math.abs(crypto.change).toFixed(2)}%
                </span>
                {connectionStatus === 'limited' && index === 0 && (
                  <span className="ml-2 text-xs text-yellow-600">(Data limited)</span>
                )}
              </span>
            ))
          ) : (
            <span className="text-sm font-medium mx-6 flex items-center">
              <div className="animate-pulse flex items-center">
                <div className="w-5 h-5 bg-gray-200 rounded-full mr-2"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
              </div>
            </span>
          )}
        </div>

        {/* Refresh button cho manual update khi offline */}
        {connectionStatus === 'offline' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Sàn Giao Dịch */}
      {exchanges && (
        <div className="flex justify-center items-center gap-4 p-2 border-t w-full text-center">
          <span className="font-bold text-sm">24h Volume:</span>
          <div className="flex gap-4">
            {exchanges.map((exchange) => (
              <div key={exchange.id} className="flex items-center gap-2">
                <img 
                  src={exchange.image} 
                  alt={exchange.name} 
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder/24/24.jpg';
                  }}
                />
                <span className="text-sm font-medium">
                  {exchange.volume?.toFixed(2) ?? "N/A"} BTC
                </span>
              </div>
            ))}
          </div>
          
          {connectionStatus !== 'online' && (
            <div className="ml-4">
              <StatusIndicator />
            </div>
          )}
        </div>
      )}
    </div>
  );
};