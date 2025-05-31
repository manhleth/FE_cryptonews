"use client";
import { CryptoWatchlistManager } from '@/components/CryptoWatchlistManager';

export default function WatchlistPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Crypto Watchlist</h1>
          <p className="text-gray-600 mt-2">Quản lý danh sách theo dõi tiền điện tử của bạn</p>
        </div>
        <CryptoWatchlistManager />
      </div>
    </div>
  );
}