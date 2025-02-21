"use client";

import React from "react";

interface NewsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const NewsSection = ({ title, children }: NewsSectionProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {title === "Mới Nhất" && (
          <a href="#" className="text-gray-500 hover:text-gray-700">
            More →
          </a>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </div>
  );
};
