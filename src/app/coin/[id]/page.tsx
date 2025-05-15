// src/app/coin/[id]/page.tsx
"use client";
import { use, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import { PriceChart } from '@/components/PriceChart';

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

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export default function CoinDetailPage({ params }: CoinDetailProps) {
  const resolvedParams = params instanceof Promise ? params : Promise.resolve(params);
  const { id } = use(resolvedParams);
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [coinDetail, setCoinDetail] = useState<CoinDetail | null>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [timeRange, setTimeRange] = useState('7');
  const [isLoading, setIsLoading] = useState(true);
  const [isWatched, setIsWatched] = useState(false);

  // Fetch coin details
  useEffect(() => {
    const fetchCoinDetail = async () => {
      setIsLoading(true);
      try {
        const [detailResponse, priceResponse] = await Promise.all([
          fetch(`${COINGECKO_API_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
          fetch(`${COINGECKO_API_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${timeRange}`)
        ]);

        if (detailResponse.ok && priceResponse.ok) {
          const detail = await detailResponse.json();
          const priceChart = await priceResponse.json();
          
          setCoinDetail(detail);
          setPriceData(priceChart.prices.map(([timestamp, price]: [number, number]) => ({
            timestamp,
            price
          })));
        }
      } catch (error) {
        console.error('Error fetching coin details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoinDetail();
  }, [id, timeRange]);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatSupply = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const toggleWatchlist = () => {
    if (!user) return;
    setIsWatched(!isWatched);
    // TODO: Save to API
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
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
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {coinDetail.name}
                  <span className="text-gray-500 ml-2">({coinDetail.symbol.toUpperCase()})</span>
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Rank #{coinDetail.market_data.market_cap_rank}</span>
                </div>
              </div>
            </div>
          </div>
          
          {user && (
            <Button
              variant="outline"
              onClick={toggleWatchlist}
              className={isWatched ? 'bg-yellow-50 border-yellow-300' : ''}
            >
              <Star className={`h-4 w-4 mr-2 ${isWatched ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {isWatched ? 'Watching' : 'Add to Watchlist'}
            </Button>
          )}
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
                    <div className={`text-sm ${
                      coinDetail.market_data.price_change_percentage_7d >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {coinDetail.market_data.price_change_percentage_7d?.toFixed(2)}% (7d)
                    </div>
                    <div className={`text-sm ${
                      coinDetail.market_data.price_change_percentage_30d >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {coinDetail.market_data.price_change_percentage_30d?.toFixed(2)}% (30d)
                    </div>
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
                      Loading chart data...
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
                  __html: coinDetail.description.en.slice(0, 500) + '...' 
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}