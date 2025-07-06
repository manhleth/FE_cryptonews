// src/app/coin/[id]/page.tsx
"use client";
import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, TrendingUp, TrendingDown, ExternalLink, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { PriceChart } from '@/components/PriceChart';
import { optimizedCryptoAPI } from '@/services/optimizedCryptoApi';
import { useToast } from "@/hooks/use-toast";

interface CoinDetailProps {
  params: { id: string } | Promise<{ id: string }>;
}

interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: {
    large: string;
  };
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    blockchain_site: string[];
  };
  market_data: {
    current_price: {
      usd: number;
    };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    market_cap_rank: number;
    ath: {
      usd: number;
    };
    atl: {
      usd: number;
    };
  };
}

interface PriceData {
  timestamp: number;
  price: number;
}

type ConnectionStatus = 'online' | 'offline' | 'limited';

export default function CoinDetailPage({ params }: CoinDetailProps) {
  const resolvedParams = params instanceof Promise ? params : Promise.resolve(params);
  const { id } = use(resolvedParams);
  const router = useRouter();
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  const [coinDetail, setCoinDetail] = useState<CoinDetail | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [timeRange, setTimeRange] = useState('7');
  const [isLoading, setIsLoading] = useState(true);
  const [isWatched, setIsWatched] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');
  const [retryCount, setRetryCount] = useState(0);
  const [isUpdatingWatchlist, setIsUpdatingWatchlist] = useState(false);

  // Error fallback data
  const getFallbackCoinDetail = (): CoinDetail => ({
    id: id,
    symbol: id.toUpperCase(),
    name: id.charAt(0).toUpperCase() + id.slice(1),
    image: {
      large: `https://coin-images.coingecko.com/coins/images/1/large/${id}.png`
    },
    description: {
      en: 'Thông tin chi tiết không khả dụng do lỗi kết nối. Vui lòng thử lại sau.'
    },
    links: {
      homepage: [],
      blockchain_site: []
    },
    market_data: {
      current_price: { usd: 0 },
      price_change_percentage_24h: 0,
      price_change_percentage_7d: 0,
      price_change_percentage_30d: 0,
      market_cap: { usd: 0 },
      total_volume: { usd: 0 },
      circulating_supply: 0,
      total_supply: 0,
      max_supply: 0,
      market_cap_rank: 0,
      ath: { usd: 0 },
      atl: { usd: 0 }
    }
  });

  // Fetch coin details with improved error handling
  const fetchCoinDetail = async () => {
    setIsLoading(true);
    try {
      setConnectionStatus('online');
      
      const [detailResponse, priceResponse] = await Promise.allSettled([
        optimizedCryptoAPI.getCoinDetails(id),
        optimizedCryptoAPI.getCoinPriceHistory(id, timeRange)
      ]);

      // Handle coin details
      if (detailResponse.status === 'fulfilled') {
        setCoinDetail(detailResponse.value);
      } else {
        console.error('Failed to fetch coin details:', detailResponse.reason);
        setConnectionStatus('limited');
        setCoinDetail(getFallbackCoinDetail());
        
        toast({
          title: "Dữ liệu giới hạn",
          description: "Không thể tải đầy đủ thông tin coin. Hiển thị dữ liệu cơ bản.",
          duration: 3000
        });
      }

      // Handle price history
      if (priceResponse.status === 'fulfilled') {
        const prices = priceResponse.value.prices?.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          price
        })) || [];
        setPriceData(prices);
      } else {
        console.error('Failed to fetch price history:', priceResponse.reason);
        setPriceData([]);
      }

      setRetryCount(0);
    } catch (error: any) {
      console.error('Error fetching coin details:', error);
      setRetryCount(prev => prev + 1);
      
      if (error.message === 'RATE_LIMITED' || error.message === 'CIRCUIT_BREAKER_OPEN') {
        setConnectionStatus('limited');
        toast({
          title: "Giới hạn API",
          description: "Đã đạt giới hạn request. Thử lại sau vài phút.",
          variant: "destructive",
          duration: 5000
        });
      } else {
        setConnectionStatus('offline');
        toast({
          title: "Không thể kết nối",
          description: "Không thể tải thông tin coin. Vui lòng kiểm tra kết nối mạng.",
          variant: "destructive",
          duration: 5000
        });
      }
      
      // Set fallback data
      setCoinDetail(getFallbackCoinDetail());
      setPriceData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if coin is in watchlist
  const checkWatchlistStatus = async () => {
    if (!user || !token) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/Watchlist/IsInWatchlist?userId=${user.userId}&coinId=${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        setIsWatched(result.data?.isInWatchlist || false);
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  // Toggle watchlist
  const toggleWatchlist = async () => {
    if (!user || !token || !coinDetail) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng tính năng watchlist",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    setIsUpdatingWatchlist(true);
    
    try {
      const watchlistData = {
        coinId: id,
        coinSymbol: coinDetail.symbol,
        coinName: coinDetail.name,
        coinImage: coinDetail.image.large,
        order: 0
      };

      const response = await fetch(
        `http://localhost:5000/api/Watchlist/ToggleWatchlist?userId=${user.userId}`,
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
        const result = await response.json();
        const action = result.data?.action || (isWatched ? 'removed' : 'added');
        
        setIsWatched(!isWatched);
        
        toast({
          title: action === 'added' ? "Đã thêm vào watchlist" : "Đã xóa khỏi watchlist",
          description: `${coinDetail.name} ${action === 'added' ? 'đã được thêm vào' : 'đã được xóa khỏi'} danh sách theo dõi`,
          duration: 2000
        });
      } else {
        throw new Error('Failed to toggle watchlist');
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật watchlist. Vui lòng thử lại.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsUpdatingWatchlist(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchCoinDetail();
  };

  // Effects
  useEffect(() => {
    fetchCoinDetail();
  }, [id, timeRange]);

  useEffect(() => {
    if (user && token) {
      checkWatchlistStatus();
    }
  }, [user, token, id]);

  // Format functions
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `${price.toFixed(6)}`;
    }
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return `${num.toFixed(2)}`;
  };

  const formatSupply = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="mt-4 text-gray-600">Loading coin details...</p>
        </div>
      </div>
    );
  }

  if (!coinDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Coin not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <img 
                src={coinDetail.image.large} 
                alt={coinDetail.name}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder/48/48.jpg';
                }}
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {coinDetail.name}
                  <span className="text-gray-500 ml-2">({coinDetail.symbol.toUpperCase()})</span>
                  {getConnectionIcon()}
                </h1>
                <div className="flex items-center space-x-2">
                  {coinDetail.market_data.market_cap_rank > 0 && (
                    <span className="text-gray-600">Rank #{coinDetail.market_data.market_cap_rank}</span>
                  )}
                  {retryCount > 0 && (
                    <span className="text-xs text-yellow-600">
                      (Kết nối chậm - Retry {retryCount})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {user && (
              <Button
                variant="outline"
                onClick={toggleWatchlist}
                disabled={isUpdatingWatchlist}
                className={isWatched ? 'bg-yellow-50 border-yellow-300' : ''}
              >
                <Star className={`h-4 w-4 mr-2 ${isWatched ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                {isUpdatingWatchlist ? 'Updating...' : (isWatched ? 'Watching' : 'Add to Watchlist')}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Price Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Price Chart</CardTitle>
                  <div className="flex space-x-2">
                    {['1', '7', '30', '90', '365'].map((days) => (
                      <Button
                        key={days}
                        variant={timeRange === days ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeRange(days)}
                        className="text-xs"
                        disabled={connectionStatus === 'offline'}
                      >
                        {days === '1' ? '24H' : days === '7' ? '7D' : days === '30' ? '1M' : days === '90' ? '3M' : '1Y'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Price Display */}
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(coinDetail.market_data.current_price.usd)}
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className={`flex items-center ${
                      coinDetail.market_data.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {coinDetail.market_data.price_change_percentage_24h >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(coinDetail.market_data.price_change_percentage_24h || 0).toFixed(2)}% (24h)
                    </div>
                    {coinDetail.market_data.price_change_percentage_7d && (
                      <div className={`text-sm ${
                        coinDetail.market_data.price_change_percentage_7d >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {coinDetail.market_data.price_change_percentage_7d?.toFixed(2)}% (7d)
                      </div>
                    )}
                    {coinDetail.market_data.price_change_percentage_30d && (
                      <div className={`text-sm ${
                        coinDetail.market_data.price_change_percentage_30d >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {coinDetail.market_data.price_change_percentage_30d?.toFixed(2)}% (30d)
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart */}
                <div className="h-96 bg-white rounded-lg border">
                  {priceData.length > 0 ? (
                    <PriceChart 
                      data={priceData}
                      color={coinDetail.market_data.price_change_percentage_24h >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      {connectionStatus === 'offline' ? (
                        <div className="text-center">
                          <WifiOff className="h-8 w-8 mx-auto mb-2" />
                          <p>Không thể tải dữ liệu biểu đồ</p>
                          <Button size="sm" onClick={handleRefresh} className="mt-2">
                            Thử lại
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                          <p>Dữ liệu biểu đồ không khả dụng</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Data */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Cap</span>
                  <span className="font-semibold">
                    {formatLargeNumber(coinDetail.market_data.market_cap.usd)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">24h Volume</span>
                  <span className="font-semibold">
                    {formatLargeNumber(coinDetail.market_data.total_volume.usd)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Circulating Supply</span>
                  <span className="font-semibold">
                    {formatSupply(coinDetail.market_data.circulating_supply)} {coinDetail.symbol.toUpperCase()}
                  </span>
                </div>
                {coinDetail.market_data.total_supply && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Supply</span>
                    <span className="font-semibold">
                      {formatSupply(coinDetail.market_data.total_supply)} {coinDetail.symbol.toUpperCase()}
                    </span>
                  </div>
                )}
                {coinDetail.market_data.max_supply && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Supply</span>
                    <span className="font-semibold">
                      {formatSupply(coinDetail.market_data.max_supply)} {coinDetail.symbol.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">All-Time High</span>
                  <span className="font-semibold">
                    {formatPrice(coinDetail.market_data.ath.usd)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">All-Time Low</span>
                  <span className="font-semibold">
                    {formatPrice(coinDetail.market_data.atl.usd)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {coinDetail.links.homepage[0] && (
                  <a
                    href={coinDetail.links.homepage[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Official Website</span>
                  </a>
                )}
                {coinDetail.links.blockchain_site[0] && (
                  <a
                    href={coinDetail.links.blockchain_site[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Explorer</span>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        {coinDetail.description.en && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>About {coinDetail.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: connectionStatus === 'online' 
                    ? coinDetail.description.en.slice(0, 500) + '...'
                    : coinDetail.description.en
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Connection Status Warning */}
        {connectionStatus !== 'online' && (
          <Card className="mt-4 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                {getConnectionIcon()}
                <span className="font-medium">
                  {connectionStatus === 'limited' 
                    ? 'Dữ liệu giới hạn - Một số thông tin có thể không cập nhật'
                    : 'Không thể kết nối - Hiển thị dữ liệu cơ bản'
                  }
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  className="ml-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}