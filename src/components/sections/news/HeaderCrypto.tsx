"use client"
import React from 'react';
import { Search } from 'lucide-react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export const HeaderCrypto = () => {
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/User/Login");
  };
    return (
      <header className="w-full bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Search */}
            <div className="flex items-center flex-1 gap-8">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-500">98</span>
                <div className="flex flex-col">
                  <span className="font-bold">COIN98</span>
                  <span className="text-xs text-gray-500">INSIGHTS</span>
                </div>
              </div>
              
              <div className="relative flex-1 max-w-md">
                <Input
                  type="search"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
  
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6 mx-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Learn</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Series</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Report</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Inside Coin98</a>
            </nav>
  
            {/* Settings and Sign In */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSignIn}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  };
  