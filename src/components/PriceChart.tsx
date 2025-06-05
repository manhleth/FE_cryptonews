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
        <p className="text-gray-500">Không có dữ liệu biểu đồ</p>
      </div>
    );
  }

  // Tính toán giá min và max để scale
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // Kích thước SVG
  const width = 800;
  const height = 400;
  const padding = 40;

  // Tạo đường path SVG
  const createPath = () => {
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Tạo đường path cho vùng tô màu
  const createAreaPath = () => {
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const areaPath = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;
    return areaPath;
  };

  // Format giá theo định dạng Việt Nam
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString('vi-VN', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  // Format ngày theo định dạng Việt Nam
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format thời gian chi tiết
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-96 bg-white rounded-lg p-4">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Lưới nền */}
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

        {/* Định nghĩa gradient */}
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Vùng tô màu */}
        <path
          d={createAreaPath()}
          fill="url(#priceGradient)"
        />

        {/* Đường giá */}
        <path
          d={createPath()}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Các điểm dữ liệu */}
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
                {formatDateTime(point.timestamp)}: {formatPrice(point.price)}
              </title>
            </circle>
          );
        })}

        {/* Nhãn trục Y */}
        <text
          x={padding - 10}
          y={padding}
          textAnchor="end"
          className="text-xs fill-gray-600"
        >
          {formatPrice(maxPrice)}
        </text>
        <text
          x={padding - 10}
          y={height - padding}
          textAnchor="end"
          className="text-xs fill-gray-600"
        >
          {formatPrice(minPrice)}
        </text>

        {/* Nhãn trục X - hiển thị ngày đầu và cuối */}
        {data.length > 0 && (
          <>
            <text
              x={padding}
              y={height - 10}
              textAnchor="start"
              className="text-xs fill-gray-600"
            >
              {formatDate(data[0].timestamp)}
            </text>
            <text
              x={width - padding}
              y={height - 10}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {formatDate(data[data.length - 1].timestamp)}
            </text>
          </>
        )}

        {/* Chú thích */}
        <text
          x={width / 2}
          y={30}
          textAnchor="middle"
          className="text-sm fill-gray-700 font-medium"
        >
          Biểu đồ giá ({data.length} điểm dữ liệu)
        </text>
      </svg>
    </div>
  );
};