"use client";
import React from "react";

export const FooterCrypto = () => {
  return (
    <footer className="border-t mt-8 py-4 text-sm text-gray-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        
        {/* Phần bên trái */}
        <div className="flex items-center gap-4">
          <span>© 2023 Coin98 Pte. Ltd. All Rights Reserved</span>
          <span className="text-gray-300">|</span>
          <span>
            Powered by 
            {/* Nếu có icon AlmosStocks, thay thế ở đây */}
            <span className="ml-1 text-gray-600 font-medium">AlmosStocks</span>
          </span>
        </div>

        {/* Phần bên phải */}
        <div className="flex items-center gap-2 text-gray-600 mt-2 md:mt-0">
          <a href="#" className="hover:underline">
            Terms of Service
          </a>
          <span>•</span>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
};
