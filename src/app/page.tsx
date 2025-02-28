// src/app/page.tsx
"use client"
import { NewsCard } from '@/components/sections/news/NewsCard';
import { CourseCard } from '@/components/sections/news/CourseCard';
import { ScrollableSection } from '@/components/sections/news/ScrollableSection';
import { mockNews, mockCourses } from '@/data/mockData';
import {HeaderCrypto} from '@/components/sections/news/HeaderCrypto'
import { CryptoTicker } from '@/components/sections/news/CryptoTicker';
import { FooterCrypto } from '@/components/sections/news/FooterCrypto';
import {Button} from "@/components/ui/button";
import BlogHeader from '@/components/sections/news/BlogNewsHeader';
import { useEffect, useState } from 'react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownmenuItem,
//   DropdownMenuTrigger
// } from "@/components/ui/dropdown-menu";
export default function Home() {
  const [newsData, setNewsData] = useState([]);
  const [prominentNewsData, setprominentNewsData] = useState([]);
  const [popularNewsData, setPopularNewsData] = useState([]);
  useEffect(() => {
    const fetchNewsByCategory = (category: any) =>
      fetch(`http://localhost:5000/api/News/GetNewsByCategoryTop?category=${category}`)
        .then((res) => res.json());

    Promise.all([
      fetchNewsByCategory(1),
      fetchNewsByCategory(2),
      fetchNewsByCategory(3),
    ])
      .then(([data1, data2, data3]) => {
        if (data1.statusCode === 1) setNewsData(data1.data);
        if (data2.statusCode === 1) setprominentNewsData(data2.data);
        if (data3.statusCode === 1) setPopularNewsData(data3.data);
      })
      .catch((err) => console.error("Error fetching news data: ", err));
  }, []);
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <BlogHeader/>
      <ScrollableSection title="Bài viết nổi bật">
        {prominentNewsData.map((item: any, index: number) => (
          <NewsCard key={item.newsID || index} item={item} />
        ))}
      </ScrollableSection>

      <ScrollableSection title="Mới Nhất">
        {newsData.map((item: any, index: number) => (
          <NewsCard key={item.newsID || index} item={item} />
        ))}
      </ScrollableSection>

      <ScrollableSection title="Xu hướng">
        {popularNewsData.map((item: any, index: number) => (
          <NewsCard key={item.newsID || index} item={item} />
        ))}
      </ScrollableSection>

      <ScrollableSection title="Khóa học">
        {newsData.map((item: any, index: number) => (
          <NewsCard key={item.newsID || index} item={item} />
        ))}
      </ScrollableSection>
    </div>
  );
}