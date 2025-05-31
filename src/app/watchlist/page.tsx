"use client";
import { CryptoWatchlistManager } from '@/components/CryptoWatchlistManager';

export default function WatchlistPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <CryptoWatchlistManager />
      </div>
    </div>
  );
}