"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkIcon, Clock, Share2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NewsCardProps {
  item: {
    id: number;
    title: string;
    author: string;
    timeAgo: string;
    readTime: string;
    image: string;
    excerpt: string;
    userName: string;
    CreatedDate: string;
    timeReading: string;
    header: string;
    newsID: number;
    imagesLink: string;
    userAvartar: string;
  }
}

export const NewsCard = ({ item }: NewsCardProps) => {
  const router = useRouter();
  const { token } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSavedNews = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/Saved/GetYourListSaved', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result?.data) {
          const savedNewsIds = result.data.map((saved: any) => saved.newsId);
          setIsSaved(savedNewsIds.includes(item.newsID));
        }
      } catch (error) {
        console.error("Error fetching saved news:", error);
      }
    };

    if (token) {
      fetchSavedNews();
    }
  }, [token, item.newsID]);

  const handleCardClick = () => {
    router.push(`/news/${item.newsID}`);
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      console.log("No token for bookmark");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/Saved/AddOrRemoveSaved?newsID=${item.newsID}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setIsSaved(prev => !prev);
      } else {
        console.error("Failed to toggle bookmark");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/news/${item.newsID}`;
    if (navigator.share) {
      navigator.share({
        title: item.header || item.title,
        text: item.title,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <Card 
      className="w-[280px] flex-none group hover:shadow-lg transition-all duration-300 bg-white border border-gray-200 hover:border-emerald-200 overflow-hidden rounded-xl cursor-pointer"
      onClick={handleCardClick}
      style={{ height: '400px' }} // Cố định chiều cao card
    >
      {/* Ảnh bài viết - cố định chiều cao */}
      <div className="relative w-full h-[160px] overflow-hidden">
        <img
          src={item.imagesLink || "/placeholder/400/250.jpg"}
          alt={item.header || item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* View count */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Eye size={12} />
          1.2k
        </div>
      </div>
      
      {/* Nội dung bài viết */}
      <CardContent className="p-4 flex flex-col h-[240px]">
        {/* Thông tin tác giả */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={item.userAvartar || "/placeholder/400/250.jpg"} alt={item.userName || "User"} />
            <AvatarFallback className="bg-emerald-100 text-emerald-700">
              {item.userName?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{item.userName || "Unknown"}</p>
            <p className="text-xs text-gray-500">{item.timeAgo || "Gần đây"}</p>
          </div>
        </div>
        
        {/* Tiêu đề bài viết */}
        <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {item.header || item.title}
        </h3>
        
        {/* Mô tả ngắn */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-auto">
          {item.title || item.excerpt}
        </p>
        
        {/* Footer với thời gian đọc và các nút */}
        <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{item.timeReading || "5"} phút đọc</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleBookmarkClick}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Toggle Bookmark"
              disabled={loading}
            >
              <BookmarkIcon
                size={16}
                className={`${isSaved ? 'fill-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-emerald-500'} transition-colors`}
              />
            </button>
            <button 
              onClick={handleShareClick}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Share"
            >
              <Share2 size={16} className="text-gray-400 hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};