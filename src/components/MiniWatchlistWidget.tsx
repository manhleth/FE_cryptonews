// src/components/MiniWatchlistWidget.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, TrendingDown, RefreshCw, Eye, EyeOff, Plus } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
}

interface WatchlistItem {
  watchlistId: number;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  coinImage: string;
  order: number;
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export const MiniWatchlistWidget = () => {
  const { user, token } = useAuth();
  
  // States
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [coinPrices, setCoinPrices] = useState<{[key: string]: CoinData}>({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch user's watchlist
  const fetchWatchlist = async () => {
    if (!user || !token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/Watchlist/GetUserWatchlist?userId=${user.userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch watchlist');
      
      const result = await response.json();
      
      if (result && Array.isArray(result)) {
        setWatchlist(result);
        
        // Fetch prices for watchlist coins
        if (result.length > 0) {
          const coinIds = result.map((item: WatchlistItem) => item.coinId).join(',');
          fetchCoinPrices(coinIds);
        }
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch coin prices
  const fetchCoinPrices = async (coinIds: string) => {
    try {
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );
      
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const data = await response.json();
      const pricesMap: {[key: string]: CoinData} = {};
      
      data.forEach((coin: CoinData) => {
        pricesMap[coin.id] = coin;
      });
      
      setCoinPrices(pricesMap);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching coin prices:', error);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  // Format last update time
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m trước`;
    return `${Math.floor(diff / 3600)}h trước`;
  };

  // Load watchlist when user logs in
  useEffect(() => {
    if (user && token) {
      fetchWatchlist();
    } else {
      setWatchlist([]);
      setCoinPrices({});
    }
  }, [user, token]);

  // Auto refresh prices every 60 seconds
  useEffect(() => {
    if (watchlist.length > 0) {
      const interval = setInterval(() => {
        const coinIds = watchlist.map(item => item.coinId).join(',');
        fetchCoinPrices(coinIds);
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [watchlist]);

  if (!user) {
    return (
      <Card className="sticky top-4 w-80 bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-gray-900">
            Crypto Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Đăng nhập để tạo watchlist</p>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/User/Login">Đăng nhập</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4 w-80 bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2 fill-current" />
              My Watchlist
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500">{watchlist.length} coins</p>
              {lastUpdate && (
                <p className="text-xs text-gray-400">
                  {formatLastUpdate(lastUpdate)}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWatchlist}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="px-0 pt-0">
          {watchlist.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Chưa có coin nào trong watchlist</p>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/watchlist">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm coin
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {watchlist
                  .sort((a, b) => a.order - b.order)
                  .map((item) => {
                    const coinData = coinPrices[item.coinId];
                    
                    return (
                      <Link 
                        key={item.watchlistId}
                        href={`/coin/${item.coinId}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors">
                          <div className="flex items-center space-x-3">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <div className="flex items-center space-x-2">
                              <img 
                                src={item.coinImage} 
                                alt={item.coinName}
                                className="w-6 h-6 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder/24/24.jpg';
                                }}
                              />
                              <div>
                                <div className="font-medium text-gray-900">{item.coinSymbol.toUpperCase()}</div>
                                <div className="text-xs text-gray-500 truncate w-20">{item.coinName}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {coinData ? (
                              <>
                                <div className="font-medium text-gray-900 text-sm">
                                  {formatPrice(coinData.current_price)}
                                </div>
                                <div className={`flex items-center text-xs ${
                                  coinData.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {coinData.price_change_percentage_24h >= 0 ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                  )}
                                  {Math.abs(coinData.price_change_percentage_24h || 0).toFixed(2)}%
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">Loading...</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
              
              <div className="px-4 py-3 bg-emerald-50 border-t">
                <Button asChild size="sm" variant="outline" className="w-full text-xs h-7">
                  <Link href="/watchlist">
                    Quản lý watchlist →
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};