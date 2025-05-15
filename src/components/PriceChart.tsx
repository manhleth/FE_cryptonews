// src/components/PriceChart.tsx
"use client";
import React from 'react';

interface PriceData {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PriceData[];
  color?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ 
  data, 
  color = '#10b981' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  // Calculate min and max prices for scaling
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // SVG dimensions
  const width = 800;
  const height = 400;
  const padding = 40;

  // Create SVG path
  const createPath = () => {
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Create area path (for fill)
  const createAreaPath = () => {
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const areaPath = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;
    return areaPath;
  };

  return (
    <div className="h-96 bg-white rounded-lg p-4">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={createAreaPath()}
          fill="url(#priceGradient)"
        />

        {/* Price line */}
        <path
          d={createPath()}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              opacity="0.8"
              className="hover:opacity-100 hover:r-4 transition-all cursor-pointer"
            >
              <title>
                {new Date(point.timestamp).toLocaleDateString()}: ${point.price.toFixed(4)}
              </title>
            </circle>
          );
        })}

        {/* Y-axis labels */}
        <text
          x={padding - 10}
          y={padding}
          textAnchor="end"
          className="text-xs fill-gray-600"
        >
          ${maxPrice.toFixed(2)}
        </text>
        <text
          x={padding - 10}
          y={height - padding}
          textAnchor="end"
          className="text-xs fill-gray-600"
        >
          ${minPrice.toFixed(2)}
        </text>
      </svg>
    </div>
  );
};