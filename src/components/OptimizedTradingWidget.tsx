// src/components/OptimizedTradingWidget.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Eye, EyeOff, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { optimizedCryptoAPI, type CoinData } from '@/services/optimizedCryptoApi';

interface WatchlistItem {
  watchlistId: number;
  userId: number;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  coinImage: string;
  order: number;
  isActive: boolean;
  createdDate: string;
}

type ConnectionStatus = 'online' | 'offline' | 'limited';

export const OptimizedTradingWidget = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  // States
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');

  // Memoized functions
  const formatPrice = useCallback((price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  }, []);

  const formatLastUpdate = useCallback((date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, []);

  // Optimized data fetching
  const fetchCoins = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      setConnectionStatus('online');
      const data = await optimizedCryptoAPI.getTopCoins(100);
      
      if (data && data.length > 0) {
        setCoins(data);
        setLastUpdate(new Date());
        
        // Check if data contains fallback flag
        if (data.some(coin => 'fallback' in coin)) {
          setConnectionStatus('limited');
        }
      } else {
        throw new Error('No data received');
      }
    } catch (error: any) {
      console.error('Error fetching coins:', error);
      
      if (error.message === 'RATE_LIMITED') {
        setConnectionStatus('limited');
      } else {
        setConnectionStatus('offline');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  const fetchUserWatchlist = useCallback(async () => {
    if (!user || !token) return;
    
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
      setWatchlist(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setWatchlist([]);
    }
  }, [user, token]);

  // Manual refresh with debouncing
  const handleManualRefresh = useCallback(() => {
    fetchCoins(true);
  }, [fetchCoins]);

  // Display logic
  const displayedCoins = useMemo(() => {
    if (!user) {
      return showAll ? coins : coins.slice(0, 10);
    }
    
    if (watchlist.length > 0) {
      const watchlistCoinIds = watchlist.map(item => item.coinId);
      const watchlistCoins = coins.filter(coin => watchlistCoinIds.includes(coin.id))
        .sort((a, b) => {
          const aOrder = watchlist.find(w => w.coinId === a.id)?.order || 999;
          const bOrder = watchlist.find(w => w.coinId === b.id)?.order || 999;
          return aOrder - bOrder;
        });
      const nonWatchlistCoins = coins.filter(coin => !watchlistCoinIds.includes(coin.id));
      return [...watchlistCoins, ...nonWatchlistCoins];
    }
    
    return coins;
  }, [user, showAll, coins, watchlist]);

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'limited':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  // Effects
  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  useEffect(() => {
    if (user && token) {
      fetchUserWatchlist();
    } else {
      setWatchlist([]);
    }
  }, [user, token, fetchUserWatchlist]);

  // Auto refresh every 3 minutes
  useEffect(() => {
    if (connectionStatus === 'offline') return;

    const interval = setInterval(() => {
      fetchCoins(false);
    }, 180000); // 3 minutes
    
    return () => clearInterval(interval);
  }, [fetchCoins, connectionStatus]);

  return (
    <Card className="sticky top-4 w-80 bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900">
              {user && watchlist.length > 0 ? 'Danh sách theo dõi' : 'Top Cryptocurrencies'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {user && watchlist.length > 0 && (
                <p className="text-xs text-gray-500">{watchlist.length} coins đang theo dõi</p>
              )}
              {lastUpdate && (
                <p className="text-xs text-gray-400">
                  {formatLastUpdate(lastUpdate)}
                </p>
              )}
              {getConnectionIcon()}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Refresh data"
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
          {isLoading && coins.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : connectionStatus === 'offline' && coins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <WifiOff className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm mb-2">Không thể kết nối</p>
              <Button size="sm" onClick={handleManualRefresh}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {displayedCoins.map((coin) => {
                return (
                  <Link 
                    key={coin.id}
                    href={`/coin/${coin.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500 w-8">#{coin.market_cap_rank}</span>
                        <div className="flex items-center space-x-2">
                          {coin.image && (
                            <img 
                              src={coin.image} 
                              alt={coin.name}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder/24/24.jpg';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              {coin.symbol.toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-500 truncate w-20">{coin.name}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatPrice(coin.current_price)}
                        </div>
                        <div className={`flex items-center text-xs ${
                          coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {coin.price_change_percentage_24h >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          
          {/* Status Footer */}
          {connectionStatus === 'limited' && (
            <div className="px-4 py-3 bg-yellow-50 border-t">
              <div className="flex items-center gap-2 text-xs text-yellow-700">
                <AlertTriangle className="h-3 w-3" />
                <span>Dữ liệu giới hạn - Cập nhật chậm</span>
              </div>
            </div>
          )}
          
          {!user && (
            <div className="px-4 py-3 bg-emerald-50 border-t">
              <p className="text-xs text-emerald-700 text-center mb-2">
                Đăng nhập để tạo danh sách theo dõi cá nhân
              </p>
              {!showAll && coins.length > 10 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAll(true)}
                  className="text-xs h-7 w-full"
                >
                  Xem thêm {coins.length - 10} coins khác
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};