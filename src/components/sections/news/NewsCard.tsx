"use client";
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkIcon, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';

interface NewsCardProps {
  item: {
    id: number;
    title: string;
    author: string;
    timeAgo: string;
    readTime: string;
    image: string;
    excerpt: string;
  }
}

export const NewsCard = ({ item }: NewsCardProps) => (
  <Link href={`/news/${item.id}`}>
  <Card className="min-w-[300px] md:min-w-[350px] flex-none">
    <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <img src="/api/placeholder/24/24" alt="avatar" className="rounded-full" />
        <span className="text-sm text-gray-600">{item.author}</span>
        <span className="text-sm text-gray-600">•</span>
        <span className="text-sm text-gray-600">{item.timeAgo}</span>
      </div>
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.excerpt}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>{item.readTime}</span>
        </div>
        <div className="flex gap-2">
          <BookmarkIcon className="cursor-pointer" size={20} />
          <Share2 className="cursor-pointer" size={20} />
        </div>
      </div>
    </CardContent>
  </Card>
  </Link>
);