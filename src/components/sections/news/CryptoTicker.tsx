// src/components/sections/news/CryptoTicker.tsx
"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { optimizedCryptoAPI } from "@/services/optimizedCryptoApi";

interface CryptoPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
  icon: string;
  id: string;
}

export const CryptoTicker = () => {
  const [prices, setPrices] = useState<CryptoPrice[] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'limited'>('online');
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  useEffect(() => {
    setIsClient(true);

    const fetchPrices = async () => {
      try {
        setConnectionStatus('online');
        console.log('🔄 Fetching crypto prices for ticker...');
        
        // Fetch top 10 coins for ticker
        const data = await optimizedCryptoAPI.getTopCoins(10);

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
          
        } else {
          throw new Error('No data received');
        }
      } catch (error: any) {
        console.error("❌ Error fetching crypto prices:", error);
        setRetryCount(prev => prev + 1);
        
        if (error.message === 'RATE_LIMITED') {
          setConnectionStatus('limited');
        } else if (retryCount < maxRetries) {
          setConnectionStatus('limited');
          // Retry with exponential backoff
          setTimeout(() => {
            fetchPrices();
          }, Math.pow(2, retryCount) * 3000); // 3s, 6s, 12s
        } else {
          setConnectionStatus('offline');
          // Use fallback data
          setPrices(getFallbackPrices());
        }
      }
    };

    // Initial fetch
    fetchPrices();
    
    // Auto refresh every 5 minutes (safe for rate limits)
    const interval = setInterval(() => {
      if (connectionStatus !== 'offline') {
        fetchPrices();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [connectionStatus, retryCount, maxRetries]);

  // Fallback data for offline mode
  const getFallbackPrices = (): CryptoPrice[] => {
    return [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        price: 43000,
        change: 2.5,
        icon: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png'
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        price: 2600,
        change: -1.2,
        icon: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png'
      },
      {
        id: 'binancecoin',
        name: 'BNB',
        symbol: 'BNB',
        price: 300,
        change: 0.8,
        icon: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
      }
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
                  <span className="ml-2 text-xs text-yellow-600">(Limited Data)</span>
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
    </div>
  );
};