// src/components/TradingWidget.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, TrendingDown, Eye, EyeOff, Settings, Plus, RefreshCw, Loader2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cryptoAPI } from "@/services/cryptoApi";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  market_cap_rank: number;
  error?: boolean;
}

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

export const TradingWidget = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  // States
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'limited'>('online');
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  // Debounced refresh để tránh spam requests
  const [refreshDebounced, setRefreshDebounced] = useState(false);

  // Fetch coins data với error handling tốt hơn
  const fetchCoins = useCallback(async (showLoading = true) => {
    if (refreshDebounced) return;
    
    if (showLoading) setIsLoading(true);
    setRefreshDebounced(true);
    
    try {
      setConnectionStatus('online');
      const data = await cryptoAPI.getTopCoins(100);
      
      if (data && data.length > 0) {
        setCoins(data);
        setLastUpdate(new Date());
        setRetryCount(0);
        
        // Check if data contains error flag (fallback data)
        if (data[0]?.error) {
          setConnectionStatus('limited');
          toast({
            title: "Dữ liệu giới hạn",
            description: "Đang sử dụng dữ liệu dự phòng do giới hạn API",
            duration: 3000
          });
        }
      } else {
        throw new Error('No data received');
      }
    } catch (error: any) {
      console.error('Error fetching coins:', error);
      setRetryCount(prev => prev + 1);
      
      if (error.message === 'RATE_LIMITED') {
        setConnectionStatus('limited');
        toast({
          title: "Giới hạn API",
          description: "Đã đạt giới hạn request. Thử lại sau vài phút.",
          variant: "destructive",
          duration: 5000
        });
      } else if (retryCount < maxRetries) {
        setConnectionStatus('limited');
        // Retry với delay tăng dần
        setTimeout(() => {
          fetchCoins(false);
        }, Math.pow(2, retryCount) * 2000);
      } else {
        setConnectionStatus('offline');
        toast({
          title: "Không thể kết nối",
          description: "Không thể lấy dữ liệu giá coin. Kiểm tra kết nối mạng.",
          variant: "destructive",
          duration: 5000
        });
      }
    } finally {
      if (showLoading) setIsLoading(false);
      // Reset debounce sau 2 giây
      setTimeout(() => setRefreshDebounced(false), 2000);
    }
  }, [refreshDebounced, retryCount, maxRetries, toast]);

  // Fetch user's watchlist từ database
  const fetchUserWatchlist = useCallback(async () => {
    if (!user || !token) return;
    
    setWatchlistLoading(true);
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
      
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      
      const result = await response.json();
      
      if (result && Array.isArray(result)) {
        setWatchlist(result);
      } else {
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setWatchlist([]);
      toast({
        title: "Lỗi watchlist",
        description: "Không thể tải danh sách theo dõi",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setWatchlistLoading(false);
    }
  }, [user, token, toast]);

  // Toggle watchlist item với error handling
  const toggleWatchlist = async (coin: CoinData) => {
    if (!user || !token) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng tính năng watchlist",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    const isInWatchlist = watchlist.some(item => item.coinId === coin.id);
    
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const response = await fetch(
          `http://localhost:5000/api/Watchlist/RemoveFromWatchlist?userId=${user.userId}&coinId=${coin.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to remove from watchlist');
        }
        
        setWatchlist(prev => prev.filter(item => item.coinId !== coin.id));
        toast({
          title: "Đã xóa khỏi watchlist",
          description: `${coin.name} đã được xóa khỏi danh sách theo dõi`,
          duration: 2000
        });
      } else {
        // Add to watchlist
        const watchlistData = {
          coinId: coin.id,
          coinSymbol: coin.symbol,
          coinName: coin.name,
          coinImage: coin.image,
          order: watchlist.length + 1
        };
        
        const response = await fetch(
          `http://localhost:5000/api/Watchlist/AddToWatchlist?userId=${user.userId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(watchlistData)
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to add to watchlist');
        }
        
        // Refresh watchlist
        fetchUserWatchlist();
        toast({
          title: "Đã thêm vào watchlist",
          description: `${coin.name} đã được thêm vào danh sách theo dõi`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật watchlist. Vui lòng thử lại.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Check if coin is in watchlist
  const isInWatchlist = (coinId: string) => {
    return watchlist.some(item => item.coinId === coinId);
  };

  // Manual refresh với rate limiting
  const handleManualRefresh = () => {
    if (refreshDebounced) {
      toast({
        title: "Vui lòng đợi",
        description: "Đang làm mới dữ liệu...",
        duration: 2000
      });
      return;
    }
    fetchCoins(true);
  };

  // Load coins khi component mount
  useEffect(() => {
    fetchCoins();
    
    // Auto refresh every 60 seconds, but only if not rate limited
    const interval = setInterval(() => {
      if (connectionStatus !== 'offline' && !refreshDebounced) {
        fetchCoins(false);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchCoins, connectionStatus, refreshDebounced]);

  // Load watchlist khi user đăng nhập
  useEffect(() => {
    if (user && token) {
      fetchUserWatchlist();
    } else {
      setWatchlist([]);
    }
  }, [user, token, fetchUserWatchlist]);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // Connection status icon
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

  // Lọc danh sách coins để hiển thị
  const getDisplayedCoins = () => {
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
  };

  const filteredCoins = coins.filter(coin => 
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCoins = getDisplayedCoins();
  const watchlistCount = watchlist.length;

  return (
    <Card className="sticky top-4 w-80 bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-gray-900">
              {user && watchlistCount > 0 ? 'Danh sách theo dõi' : 'Top Cryptocurrencies'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {user && watchlistCount > 0 && (
                <p className="text-xs text-gray-500">{watchlistCount} coins đang theo dõi</p>
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
              disabled={isLoading || refreshDebounced}
              className="h-8 w-8 p-0"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading || refreshDebounced ? 'animate-spin' : ''}`} />
            </Button>
            {user && (
              <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Edit watchlist"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa danh sách theo dõi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Tìm kiếm coin..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {watchlistLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredCoins.map((coin) => (
                          <div
                            key={coin.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              {coin.image && (
                                <img 
                                  src={coin.image} 
                                  alt={coin.name}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {coin.symbol.toUpperCase()}
                                  {coin.error && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                                </div>
                                <div className="text-xs text-gray-500">{coin.name}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleWatchlist(coin)}
                              className="p-2 hover:bg-gray-100 rounded"
                              disabled={watchlistLoading}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  isInWatchlist(coin.id)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-400'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
              <Button size="sm" onClick={handleManualRefresh} disabled={refreshDebounced}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {displayedCoins.map((coin) => {
                const isWatched = isInWatchlist(coin.id);
                
                return (
                  <Link 
                    key={coin.id}
                    href={`/coin/${coin.id}`}
                    className="block"
                  >
                    <div
                      className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                        isWatched ? 'bg-emerald-50' : ''
                      } ${coin.error ? 'bg-yellow-50' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 w-10">
                          {isWatched ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <span className="text-sm text-gray-500">#{coin.market_cap_rank}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {coin.image && (
                            <img 
                              src={coin.image} 
                              alt={coin.name}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              {coin.symbol.toUpperCase()}
                              {coin.error && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
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
          
          {/* Status và Action Footer */}
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
          
          {user && watchlistCount === 0 && !watchlistLoading && (
            <div className="px-4 py-3 bg-blue-50 border-t text-center">
              <p className="text-xs text-blue-700 mb-2">
                Chưa có coin nào trong danh sách
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditMode(true)}
                className="text-xs h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Thêm coin
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};