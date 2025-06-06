// src/components/CryptoWatchlistManager.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Plus, 
  Trash2, 
  RefreshCw,
  Loader2,
  Heart,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
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

interface CoinPriceMap {
  [coinId: string]: CoinData;
}

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 120000; // 2 phút
const REFRESH_INTERVAL = 180000; // 3 phút
const MAX_RETRY_ATTEMPTS = 2;

export const CryptoWatchlistManager = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();

  // States
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [coinPrices, setCoinPrices] = useState<CoinPriceMap>({});
  const [allCoins, setAllCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [updatingCoins, setUpdatingCoins] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Cache for API responses
  const [priceCache, setPriceCache] = useState<Map<string, { data: CoinPriceMap; timestamp: number }>>(new Map());

  // Optimized fetch với cache và retry logic
  const fetchWithRetry = useCallback(async (url: string, maxRetries = MAX_RETRY_ATTEMPTS): Promise<any> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited - wait longer between retries
            const delay = Math.pow(2, attempt) * 2000; // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }, []);

  // Optimized cache check
  const getCachedPrices = useCallback((coinIds: string[]): CoinPriceMap | null => {
    const cacheKey = coinIds.sort().join(',');
    const cached = priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [priceCache]);

  // Set cache
  const setCachedPrices = useCallback((coinIds: string[], data: CoinPriceMap) => {
    const cacheKey = coinIds.sort().join(',');
    setPriceCache(prev => new Map(prev.set(cacheKey, { data, timestamp: Date.now() })));
  }, []);

  // Optimized fetch watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!user || !token) return [];
    
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
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
  }, [user, token]);

  // Batch fetch coin prices với cache
  const fetchCoinPrices = useCallback(async (coinIds: string[]) => {
    if (coinIds.length === 0) return {};

    // Check cache first
    const cached = getCachedPrices(coinIds);
    if (cached) {
      setCoinPrices(cached);
      return cached;
    }

    try {
      const idsString = coinIds.join(',');
      const data = await fetchWithRetry(
        `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );
      
      const pricesMap: CoinPriceMap = {};
      data.forEach((coin: CoinData) => {
        pricesMap[coin.id] = coin;
      });
      
      setCoinPrices(pricesMap);
      setCachedPrices(coinIds, pricesMap);
      setLastUpdate(new Date());
      setRetryCount(0);
      
      return pricesMap;
    } catch (error) {
      console.error('Error fetching coin prices:', error);
      setRetryCount(prev => prev + 1);
      return {};
    }
  }, [fetchWithRetry, getCachedPrices, setCachedPrices]);

  // Optimized fetch all coins với debounce
  const fetchAllCoins = useCallback(async () => {
    setIsLoadingCoins(true);
    try {
      const data = await fetchWithRetry(
        `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
      );
      setAllCoins(data || []);
    } catch (error) {
      console.error('Error fetching all coins:', error);
      setAllCoins([]);
      toast({
        title: "Không thể tải danh sách coin",
        description: "Vui lòng thử lại sau",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsLoadingCoins(false);
    }
  }, [fetchWithRetry, toast]);

  // Optimistic update cho add/remove operations
  const updateWatchlistOptimistic = useCallback((coinId: string, action: 'add' | 'remove', coinData?: CoinData) => {
    setWatchlist(prev => {
      if (action === 'add' && coinData) {
        const newItem: WatchlistItem = {
          watchlistId: Date.now(), // Temporary ID
          userId: user!.userId,
          coinId: coinData.id,
          coinSymbol: coinData.symbol,
          coinName: coinData.name,
          coinImage: coinData.image,
          order: prev.length + 1,
          isActive: true,
          createdDate: new Date().toISOString()
        };
        return [...prev, newItem];
      } else if (action === 'remove') {
        return prev.filter(item => item.coinId !== coinId);
      }
      return prev;
    });
  }, [user]);

  // Optimized add to watchlist
  const addToWatchlist = useCallback(async (coin: CoinData) => {
    if (!user || !token) return;
    
    setUpdatingCoins(prev => new Set(prev).add(coin.id));
    
    // Optimistic update
    updateWatchlistOptimistic(coin.id, 'add', coin);
    
    try {
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
        // Revert optimistic update
        updateWatchlistOptimistic(coin.id, 'remove');
        throw new Error('Failed to add to watchlist');
      }

      const result = await response.json();
      
      // Check if coin already existed (was re-activated)
      if (result.statusCode === 0 && result.data?.includes("already exists")) {
        // If coin already exists but was inactive, try to toggle it
        await toggleExistingCoin(coin);
        return;
      }
      
      toast({
        title: "Đã thêm vào watchlist",
        description: `${coin.name} đã được thêm vào danh sách theo dõi`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm vào watchlist",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setUpdatingCoins(prev => {
        const newSet = new Set(prev);
        newSet.delete(coin.id);
        return newSet;
      });
    }
  }, [user, token, watchlist.length, updateWatchlistOptimistic, toast]);

  // Helper function to handle existing but inactive coins
  const toggleExistingCoin = useCallback(async (coin: CoinData) => {
    try {
      const watchlistData = {
        coinId: coin.id,
        coinSymbol: coin.symbol,
        coinName: coin.name,
        coinImage: coin.image,
        order: watchlist.length + 1
      };

      const response = await fetch(
        `http://localhost:5000/api/Watchlist/ToggleWatchlist?userId=${user!.userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(watchlistData)
        }
      );

      if (response.ok) {
        // Refresh watchlist to get accurate data
        const freshWatchlist = await fetchWatchlist();
        setWatchlist(freshWatchlist);
        
        toast({
          title: "Đã thêm lại vào watchlist",
          description: `${coin.name} đã được thêm lại vào danh sách theo dõi`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error toggling existing coin:', error);
    }
  }, [user, token, watchlist.length, fetchWatchlist, toast]);

  // Optimized remove from watchlist
  const removeFromWatchlist = useCallback(async (coinId: string, coinName: string) => {
    if (!user || !token) return;
    
    setUpdatingCoins(prev => new Set(prev).add(coinId));
    
    // Optimistic update
    updateWatchlistOptimistic(coinId, 'remove');
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/Watchlist/RemoveFromWatchlist?userId=${user.userId}&coinId=${coinId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        // Revert bằng cách fetch lại
        const freshWatchlist = await fetchWatchlist();
        setWatchlist(freshWatchlist);
        throw new Error('Failed to remove from watchlist');
      }
      
      toast({
        title: "Đã xóa khỏi watchlist",
        description: `${coinName} đã được xóa khỏi danh sách theo dõi`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa khỏi watchlist",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setUpdatingCoins(prev => {
        const newSet = new Set(prev);
        newSet.delete(coinId);
        return newSet;
      });
    }
  }, [user, token, updateWatchlistOptimistic, fetchWatchlist, toast]);

  // Memoized calculations
  const isInWatchlist = useCallback((coinId: string) => {
    return watchlist.some(item => item.coinId === coinId);
  }, [watchlist]);

  const filteredCoins = useMemo(() => {
    return allCoins.filter(coin => 
      !isInWatchlist(coin.id) && (
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [allCoins, isInWatchlist, searchTerm]);

  const formatPrice = useCallback((price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  }, []);

  const formatMarketCap = useCallback((marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  }, []);

  // Initial data loading
  useEffect(() => {
    if (user && token) {
      setIsLoading(true);
      Promise.all([
        fetchWatchlist().then(setWatchlist),
        fetchAllCoins()
      ]).finally(() => setIsLoading(false));
    }
  }, [user, token, fetchWatchlist, fetchAllCoins]);

  // Auto fetch prices when watchlist changes
  useEffect(() => {
    if (watchlist.length > 0) {
      const coinIds = watchlist.map(item => item.coinId);
      fetchCoinPrices(coinIds);
    }
  }, [watchlist, fetchCoinPrices]);

  // Optimized auto refresh - 3 phút interval
  useEffect(() => {
    if (watchlist.length === 0) return;

    const interval = setInterval(() => {
      const coinIds = watchlist.map(item => item.coinId);
      fetchCoinPrices(coinIds);
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [watchlist, fetchCoinPrices]);

  // Manual refresh with rate limiting
  const handleRefresh = useCallback(() => {
    if (watchlist.length > 0) {
      const coinIds = watchlist.map(item => item.coinId);
      fetchCoinPrices(coinIds);
    }
  }, [watchlist, fetchCoinPrices]);

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Đăng nhập để sử dụng Watchlist
          </h3>
          <p className="text-gray-600 text-center mb-4">
            Tạo danh sách theo dõi cá nhân để theo dõi các đồng coin yêu thích
          </p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/User/Login">Đăng nhập ngay</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-3" />
          <span className="text-gray-600">Đang tải danh sách theo dõi...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2 fill-current" />
                Danh sách theo dõi
              </CardTitle>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                Theo dõi {watchlist.length} đồng coin yêu thích
                {lastUpdate && (
                  <span className="text-xs text-gray-400">
                    • Cập nhật {Math.floor((Date.now() - lastUpdate.getTime()) / 60000)} phút trước
                  </span>
                )}
                {retryCount > 0 && (
                  <span className="flex items-center text-xs text-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Kết nối chậm
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="h-9"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 h-9">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm coin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Thêm coin vào watchlist</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm coin..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {isLoadingCoins ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                          <span className="ml-2 text-gray-600">Đang tải danh sách coin...</span>
                        </div>
                      ) : filteredCoins.length > 0 ? (
                        filteredCoins.slice(0, 20).map((coin) => (
                          <div
                            key={coin.id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border"
                          >
                            <div className="flex items-center space-x-3">
                              <img 
                                src={coin.image} 
                                alt={coin.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <div className="font-medium">{coin.symbol.toUpperCase()}</div>
                                <div className="text-xs text-gray-500">{coin.name}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-medium">{formatPrice(coin.current_price)}</div>
                                <div className={`text-xs ${
                                  coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                                  {coin.price_change_percentage_24h?.toFixed(2)}%
                                </div>
                              </div>
                              
                              <Button
                                size="sm"
                                onClick={() => addToWatchlist(coin)}
                                disabled={updatingCoins.has(coin.id)}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                {updatingCoins.has(coin.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          {searchTerm ? "Không tìm thấy coin phù hợp" : "Không có coin nào để thêm"}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Đóng
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có coin nào trong watchlist
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Thêm các đồng coin bạn quan tâm để theo dõi giá cả và xu hướng
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm coin đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((item) => {
            const coinData = coinPrices[item.coinId];
            
            return (
              <Card key={item.watchlistId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={item.coinImage} 
                        alt={item.coinName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{item.coinSymbol.toUpperCase()}</h3>
                        <p className="text-sm text-gray-600">{item.coinName}</p>
                      </div>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={updatingCoins.has(item.coinId)}
                        >
                          {updatingCoins.has(item.coinId) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa khỏi watchlist?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc muốn xóa {item.coinName} khỏi danh sách theo dõi?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeFromWatchlist(item.coinId, item.coinName)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  {coinData ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {formatPrice(coinData.current_price)}
                        </span>
                        <Badge 
                          variant={coinData.price_change_percentage_24h >= 0 ? "default" : "destructive"}
                          className={coinData.price_change_percentage_24h >= 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          {coinData.price_change_percentage_24h >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(coinData.price_change_percentage_24h).toFixed(2)}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="block">Rank</span>
                          <span className="font-medium">#{coinData.market_cap_rank}</span>
                        </div>
                        <div>
                          <span className="block">Market Cap</span>
                          <span className="font-medium">{formatMarketCap(coinData.market_cap)}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <Link 
                          href={`/coin/${item.coinId}`}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          Xem chi tiết →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Đang tải giá...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};