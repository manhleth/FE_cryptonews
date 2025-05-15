"use client";
import React, { useEffect, useState } from "react";

interface CryptoPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
  icon: string;
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

  useEffect(() => {
    setIsClient(true);

    const fetchPrices = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false"
        );
        const data = await response.json();

        const updatedPrices: CryptoPrice[] = data.map((coin: any) => ({
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          price: coin.current_price,
          change: coin.price_change_percentage_24h,
          icon: coin.image,
        }));

        setPrices(updatedPrices);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu từ CoinGecko:", error);
      }
    };

    const fetchExchanges = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/exchanges");
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
      }
    };

    fetchPrices();
    fetchExchanges();
    const interval = setInterval(fetchPrices, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!isClient) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Crypto Ticker */}
      <div className="relative flex overflow-x-hidden h-12 items-center">
        <div className="absolute top-0 animate-marquee whitespace-nowrap flex">
          {prices ? (
            prices.map((crypto, index) => (
              <span key={index} className="mx-6 text-sm font-medium flex items-center">
                <img src={crypto.icon} alt={crypto.name} className="w-5 h-5 mr-2" />
                {crypto.name} ({crypto.symbol})
                <span className="mx-1">${crypto.price.toFixed(2)}</span>
                <span className={crypto.change > 0 ? "text-green-500" : "text-red-500"}>
                  {crypto.change.toFixed(2)}%
                </span>
              </span>
            ))
          ) : (
            <span className="text-sm font-medium mx-6">Đang tải dữ liệu...</span>
          )}
        </div>
      </div>

      {/* Sàn Giao Dịch */}
{exchanges && (
  <div className="flex justify-center items-center gap-4 p-2 border-t w-full text-center">
    <span className="font-bold text-sm">24h Volume:</span>
    <div className="flex gap-4">
      {exchanges.map((exchange) => (
        <div key={exchange.id} className="flex items-center gap-2">
          <img src={exchange.image} alt={exchange.name} className="w-6 h-6 rounded-full" />
          <span className="text-sm font-medium">
            {exchange.volume?.toFixed(2) ?? "N/A"} BTC
          </span>
        </div>
      ))}
    </div>
  </div>
)}

    </div>
  );
};
