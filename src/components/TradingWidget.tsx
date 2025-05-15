// src/components/TradingWidget.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, TrendingDown, Eye, EyeOff, Settings, Plus, RefreshCw } from 'lucide-react';
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
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export const TradingWidget = () => {
  const { user, token } = useAuth();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Fetch coins data từ CoinGecko
  const fetchCoins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      setCoins(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching coins:', error);
      // Fallback to mock data on error
      fetchMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback mock data
  const fetchMockData = () => {
    const mockData = [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: '',
        current_price: 42500.32,
        price_change_percentage_24h: 2.45,
        total_volume: 15800000000,
        market_cap: 830000000000,
        market_cap_rank: 1
      },
      // Add more mock data as needed
    ];
    setCoins(mockData);
    setLastUpdate(new Date());
  };

  // Load coins khi component mount
  useEffect(() => {
    fetchCoins();
    
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchCoins, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Load watchlist khi user đăng nhập
  useEffect(() => {
    if (user && token) {
      // TODO: Load watchlist từ API
      // fetchUserWatchlist();
      // Temporary default watchlist
      setWatchlist(['bitcoin', 'ethereum', 'binancecoin']);
    }
  }, [user, token]);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(1)}M`;
    } else {
      return `$${(volume / 1e3).toFixed(1)}K`;
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

  const toggleWatchlist = (coinId: string) => {
    if (!user) return;
    
    setWatchlist(prev => {
      const newWatchlist = prev.includes(coinId)
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId];
      
      // TODO: Save to API
      // saveWatchlistToAPI(newWatchlist);
      
      return newWatchlist;
    });
  };

  // Lọc danh sách coins để hiển thị
  const getDisplayedCoins = () => {
    if (!user) {
      // Cho user chưa đăng nhập, hiển thị 10 coins đầu hoặc tất cả nếu showAll = true
      return showAll ? coins : coins.slice(0, 10);
    }
    
    // Nếu có watchlist, hiển thị watchlist ở đầu + tất cả coins khác
    if (watchlist.length > 0) {
      const watchlistCoins = coins.filter(coin => watchlist.includes(coin.id));
      const nonWatchlistCoins = coins.filter(coin => !watchlist.includes(coin.id));
      return [...watchlistCoins, ...nonWatchlistCoins];
    }
    
    // Nếu chưa có watchlist, hiển thị tất cả top coins
    return coins;
  };

  // Lọc coins cho edit mode
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
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchCoins}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                              <div className="font-medium">{coin.symbol.toUpperCase()}</div>
                              <div className="text-xs text-gray-500">{coin.name}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleWatchlist(coin.id)}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                watchlist.includes(coin.id)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-400'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
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
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {displayedCoins.map((coin) => {
                const isWatched = watchlist.includes(coin.id);
                
                return (
                  <Link 
                    key={coin.id}
                    href={`/coin/${coin.id}`}
                    className="block"
                  >
                    <div
                      className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                        isWatched ? 'bg-emerald-50' : ''
                      }`}
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
                            <div className="font-medium text-gray-900">{coin.symbol.toUpperCase()}</div>
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
          
          {user && watchlistCount === 0 && (
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