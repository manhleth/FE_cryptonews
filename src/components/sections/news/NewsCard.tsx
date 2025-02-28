"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkIcon, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';
import {useAuth} from "@/context/AuthContext" // Cập nhật đường dẫn tới hook useAuth của bạn

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
  }
}

export const NewsCard = ({ item }: NewsCardProps) => {
  const { token } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Gọi API lấy danh sách news đã lưu của người dùng
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
          // Lấy danh sách newsID từ dữ liệu trả về
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

  // Xử lý click vào bookmark
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    // Ngăn chặn sự kiện click lan ra ngoài (để không trigger Link)
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/Saved/AddOrRemoveSaved?newsID=${item.newsID}`, {
        method: 'POST', // Hoặc thay thành GET nếu API của bạn yêu cầu
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        // Toggle trạng thái bookmark
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
      <Card key={item.newsID} className="min-w-[300px] md:min-w-[350px] flex-none">
        <img
          src={"/placeholder/400/250.jpg"}
          alt={item.header}
          className="w-full h-48 object-cover"
        />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <img
              src="/api/placeholder/24/24"
              alt="avatar"
              className="rounded-full"
            />
            <span className="text-sm text-gray-600">{item.userName}</span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm text-gray-600">{item.timeAgo}</span>
          </div>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.header}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.title}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} />
              <span>{item.timeReading}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBookmarkClick}
                className="cursor-pointer"
                aria-label="Toggle Bookmark"
                disabled={loading}
              >
                <BookmarkIcon
                  size={20}
                  className={`${isSaved ? 'fill-black text-black' : 'text-gray-600'}`}
                />
              </button>
              <Share2 className="cursor-pointer" size={20} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
