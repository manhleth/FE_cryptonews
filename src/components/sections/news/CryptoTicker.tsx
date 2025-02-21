"use client";
import React from "react";

export const CryptoTicker = () => {
  const prices = [
    { name: "Tether", symbol: "USDT", price: "1.00", change: "+0.0%", icon: "💵" },
    { name: "BNB", symbol: "BNB", price: "651.43", change: "-0.0%", icon: "🔶" },
    { name: "Solana", symbol: "SOL", price: "173.41", change: "+1.8%", icon: "◎" },
    { name: "Bitcoin", symbol: "BTC", price: "98,204.00", change: "+1.2%", icon: "₿" },
    { name: "Ethereum", symbol: "ETH", price: "2,737.07", change: "+0.1%", icon: "⟠" },
  ];

  return (
    <div className="relative flex overflow-x-hidden bg-white border-b border-gray-200 h-12 items-center">
      {/* Khối 1 */}
      {/* <div className="animate-marquee whitespace-nowrap">
        {prices.map((crypto, index) => (
          <span key={index} className="mx-6 text-sm font-medium">
            {crypto.icon} {crypto.name} ({crypto.symbol}) 
            <span className="mx-1">${crypto.price}</span>
            <span className={crypto.change.includes('+') ? 'text-green-500' : 'text-red-500'}>
              {crypto.change}
            </span>
          </span>
        ))}
      </div> */}

      {/* Khối 2 (lặp lại) */}
      <div className="absolute top-0 animate-marquee whitespace-nowrap">
        {prices.map((crypto, index) => (
          <span key={index} className="mx-6 text-sm font-medium">
            {crypto.icon} {crypto.name} ({crypto.symbol}) 
            <span className="mx-1">${crypto.price}</span>
            <span className={crypto.change.includes('+') ? 'text-green-500' : 'text-red-500'}>
              {crypto.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};
