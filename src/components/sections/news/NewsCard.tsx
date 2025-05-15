"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkIcon, Clock, Share2, Eye } from 'lucide-react';
import Link from 'next/link';
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

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  return (
    <Link href={`/news/${item.newsID}`}>
      <Card className="min-w-[300px] md:min-w-[350px] flex-none group hover:shadow-lg transition-all duration-300 bg-white border border-gray-200 hover:border-emerald-200 overflow-hidden rounded-xl">
        <div className="relative overflow-hidden">
          <img
            src={item.imagesLink || "/placeholder/400/250.jpg"}
            alt={item.header}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* View count */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Eye size={12} />
            1.2k
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={item.userAvartar || "/api/placeholder/24/24"} alt="avatar" />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {item.userName?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <span className="text-sm text-gray-700 font-medium">{item.userName}</span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{item.timeAgo}</span>
                <span>•</span>
                <span>{item.timeReading} min read</span>
              </div>
            </div>
          </div>
          
          <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-emerald-600 transition-colors">
            {item.header}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {item.title}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>{item.timeReading} min</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBookmarkClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Toggle Bookmark"
                disabled={loading}
              >
                <BookmarkIcon
                  size={18}
                  className={`${isSaved ? 'fill-emerald-500 text-emerald-500' : 'text-gray-400 hover:text-emerald-500'} transition-colors`}
                />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Share2 size={18} className="text-gray-400 hover:text-emerald-500 transition-colors" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};