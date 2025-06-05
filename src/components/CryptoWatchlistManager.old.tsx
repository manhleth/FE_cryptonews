// src/components/CryptoWatchlistManager.tsx
"use client";
import React, { useState, useEffect } from 'react';
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
  Settings,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Heart,
  BarChart3
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
  price_change_percentage_7d: number;
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

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export const CryptoWatchlistManager = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();

  // States
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [coinPrices, setCoinPrices] = useState<{[key: string]: CoinData}>({});
  const [allCoins, setAllCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // 🔧 FIX: Improved fetchWatchlist with better error handling and response structure check
  const fetchWatchlist = async () => {
    if (!user || !token) {
      console.log("❌ No user or token available");
      return;
    }
    
    console.log("🔄 Fetching watchlist for user:", user.userId);
    
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
      
      console.log("📡 Watchlist API response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("📊 Watchlist API response data:", result);
      
      // 🔧 FIX: Check for different response structures
      let watchlistData: WatchlistItem[] = [];
      
      if (result && result.statusCode === 1 && result.data) {
        // Standard API response structure
        watchlistData = Array.isArray(result.data) ? result.data : [];
        console.log("✅ Using result.data:", watchlistData);
      } else if (result && Array.isArray(result)) {
        // Direct array response
        watchlistData = result;
        console.log("✅ Using direct array result:", watchlistData);
      } else {
        console.log("⚠️ No watchlist data found in response");
        watchlistData = [];
      }
      
      setWatchlist(watchlistData);
      console.log("✅ Watchlist state updated:", watchlistData.length, "items");
      
      // Fetch prices for watchlist coins
      if (watchlistData.length > 0) {
        const coinIds = watchlistData.map((item: WatchlistItem) => item.coinId).join(',');
        console.log("🔄 Fetching prices for coins:", coinIds);
        await fetchCoinPrices(coinIds);
      }
    } catch (error) {
      console.error('❌ Error fetching watchlist:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách theo dõi. Vui lòng thử lại.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // 🔧 FIX: Improved fetchCoinPrices with better error handling
  const fetchCoinPrices = async (coinIds: string) => {
    try {
      console.log("🔄 Fetching coin prices for:", coinIds);
      
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`
      );
      
      console.log("📡 CoinGecko prices response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📊 CoinGecko prices data:", data);
      
      const pricesMap: {[key: string]: CoinData} = {};
      
      if (Array.isArray(data)) {
        data.forEach((coin: CoinData) => {
          pricesMap[coin.id] = coin;
        });
        
        setCoinPrices(pricesMap);
        console.log("✅ Coin prices updated:", Object.keys(pricesMap).length, "coins");
      } else {
        console.log("⚠️ Invalid coin prices data structure");
      }
      
    } catch (error) {
      console.error('❌ Error fetching coin prices:', error);
      // Don't show toast for price errors, as watchlist should still show without prices
    }
  };

  // Fetch all coins for search
  const fetchAllCoins = async () => {
    try {
      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
      );
      
      if (!response.ok) throw new Error('Failed to fetch coins');
      
      const data = await response.json();
      setAllCoins(data);
    } catch (error) {
      console.error('Error fetching all coins:', error);
    }
  };

  // 🔧 FIX: Improved addToWatchlist with better response handling
  const addToWatchlist = async (coin: CoinData) => {
    if (!user || !token) return;
    
    setIsUpdating(coin.id);
    
    try {
      const watchlistData = {
        coinId: coin.id,
        coinSymbol: coin.symbol,
        coinName: coin.name,
        coinImage: coin.image,
        order: watchlist.length + 1
      };
      
      console.log("🔄 Adding to watchlist:", watchlistData);
      
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
      
      console.log("📡 Add to watchlist response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to add to watchlist: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("📊 Add to watchlist response:", result);
      
      // 🔧 FIX: Always refresh watchlist after adding
      await fetchWatchlist();
      
      toast({
        title: "Đã thêm vào watchlist",
        description: `${coin.name} đã được thêm vào danh sách theo dõi`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('❌ Error adding to watchlist:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm vào watchlist",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // 🔧 FIX: Improved removeFromWatchlist
  const removeFromWatchlist = async (coinId: string, coinName: string) => {
    if (!user || !token) return;
    
    setIsUpdating(coinId);
    
    try {
      console.log("🔄 Removing from watchlist:", coinId);
      
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
      
      console.log("📡 Remove from watchlist response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to remove from watchlist: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("📊 Remove from watchlist response:", result);
      
      // 🔧 FIX: Always refresh watchlist after removing
      await fetchWatchlist();
      
      toast({
        title: "Đã xóa khỏi watchlist",
        description: `${coinName} đã được xóa khỏi danh sách theo dõi`,
        duration: 2000
      });
      
    } catch (error) {
      console.error('❌ Error removing from watchlist:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa khỏi watchlist",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // Check if coin is in watchlist
  const isInWatchlist = (coinId: string) => {
    const result = watchlist.some(item => item.coinId === coinId);
    console.log(`🔍 Checking if ${coinId} is in watchlist:`, result);
    return result;
  };

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  // Format market cap
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  // Filter coins for search
  const filteredCoins = allCoins.filter(coin => 
    !isInWatchlist(coin.id) && (
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // 🔧 FIX: Improved useEffect with better logging
  useEffect(() => {
    console.log("🔄 Initial load - User:", !!user, "Token:", !!token);
    
    if (user && token) {
      setIsLoading(true);
      Promise.all([
        fetchWatchlist(),
        fetchAllCoins()
      ]).finally(() => {
        console.log("✅ Initial load completed");
        setIsLoading(false);
      });
    } else {
      console.log("⚠️ No user or token, skipping initial load");
      setIsLoading(false);
    }
  }, [user, token]);

  // Auto refresh prices every 30 seconds
  useEffect(() => {
    if (watchlist.length > 0) {
      const interval = setInterval(() => {
        const coinIds = watchlist.map(item => item.coinId).join(',');
        fetchCoinPrices(coinIds);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [watchlist]);

  // 🔧 FIX: Better loading state
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
              <p className="text-gray-600 mt-1">
                Theo dõi {watchlist.length} đồng coin yêu thích của bạn
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWatchlist}
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
                      {filteredCoins.length > 0 ? (
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
                                disabled={isUpdating === coin.id}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                {isUpdating === coin.id ? (
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
                          disabled={isUpdating === item.coinId}
                        >
                          {isUpdating === item.coinId ? (
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