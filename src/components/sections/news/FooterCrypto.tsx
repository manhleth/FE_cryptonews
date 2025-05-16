"use client";
import React from "react";
import { Twitter, MessageCircle, Send, Facebook } from 'lucide-react';

export const FooterCrypto = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-3xl font-bold">₿</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">↗</span>
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl font-bold text-emerald-600">ALL-IN</span>
              <span className="text-sm font-medium text-emerald-600 tracking-wider">CRYPTOINSIGHTS</span>
            </div>
          </a>

          {/* Social Links */}
          <div className="flex items-center space-x-6">
            <a
              href="https://twitter.com/coin98"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-blue-500 transition-colors duration-200"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5 text-gray-600 group-hover:text-white" />
            </a>
            
            <a
              href="https://discord.gg/coin98"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-indigo-500 transition-colors duration-200"
              aria-label="Discord"
            >
              <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-white" />
            </a>

            <a
              href="https://t.me/coin98"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-blue-400 transition-colors duration-200"
              aria-label="Telegram"
            >
              <Send className="w-5 h-5 text-gray-600 group-hover:text-white" />
            </a>

            <a
              href="https://facebook.com/coin98"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-blue-600 transition-colors duration-200"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 text-gray-600 group-hover:text-white" />
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex items-center space-x-6 text-sm">
            <a
              href="/terms-of-service"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Terms of Service
            </a>
            <span className="text-gray-300">•</span>
            <a
              href="/privacy-policy"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Privacy Policy
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 AllinCryptoInsights Pte. Ltd. All Rights Reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
};