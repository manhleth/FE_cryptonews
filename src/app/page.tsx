// src/app/page.tsx
"use client"
import { NewsCard } from '@/components/sections/news/NewsCard';
import { CourseCard } from '@/components/sections/news/CourseCard';
import { ScrollableSection } from '@/components/sections/news/ScrollableSection';
import { mockNews, mockCourses } from '@/data/mockData';
import { HeaderCrypto } from '@/components/sections/news/HeaderCrypto'
import { CryptoTicker } from '@/components/sections/news/CryptoTicker';
import { FooterCrypto } from '@/components/sections/news/FooterCrypto';
import { Button } from "@/components/ui/button";
import BlogHeader from '@/components/sections/news/BlogNewsHeader';
import { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp, BookOpen, Star, ChevronRight } from 'lucide-react';
import { TradingWidget } from '@/components/TradingWidget';

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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative pt-10 pb-8 overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-600/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-200/5 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Crypto Insights
              </h1>
              <p className="text-lg md:text-xl text-emerald-50 max-w-2xl mx-auto">
                Khám phá thế giới tiền điện tử với những thông tin mới nhất và khóa học chuyên sâu
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="default" className="bg-white text-emerald-600 hover:bg-gray-50 px-6 py-2 rounded-full font-semibold">
                Khám phá ngay
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="default" className="border-white text-white hover:bg-white hover:text-emerald-600 px-6 py-2 rounded-full">
                Xem khóa học
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Bài viết', value: '1,200+', icon: BookOpen, color: 'bg-emerald-500' },
              { label: 'Khóa học', value: '50+', icon: Star, color: 'bg-teal-500' },
              { label: 'Học viên', value: '10,000+', icon: TrendingUp, color: 'bg-green-500' },
              { label: 'Đánh giá', value: '4.9★', icon: Star, color: 'bg-emerald-600' },
            ].map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className={`mx-auto w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto p-4 space-y-16">
          {/* Rest of content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Takes 2/3 of space */}
            <div className="lg:col-span-2 space-y-16">
              {/* Featured Articles */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Bài viết nổi bật</h2>
                  <div className="flex items-center text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium group">
                    <span>Xem tất cả</span>
                    <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <ScrollableSection title="">
                  {prominentNewsData.map((item: any, index: number) => (
                    <div key={item.newsID || index} className="transform transition-all duration-300 hover:scale-105">
                      <NewsCard item={item} />
                    </div>
                  ))}
                </ScrollableSection>
              </section>

              {/* Latest News */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Tin tức mới nhất</h2>
                  <div className="flex items-center text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium group">
                    <span>Xem tất cả</span>
                    <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <ScrollableSection title="">
                  {newsData.map((item: any, index: number) => (
                    <div key={item.newsID || index} className="transform transition-all duration-300 hover:scale-105">
                      <NewsCard item={item} />
                    </div>
                  ))}
                </ScrollableSection>
              </section>

              {/* Trending */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Xu hướng</h2>
                  <div className="flex items-center text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium group">
                    <span>Xem tất cả</span>
                    <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <ScrollableSection title="">
                  {popularNewsData.map((item: any, index: number) => (
                    <div key={item.newsID || index} className="transform transition-all duration-300 hover:scale-105">
                      <NewsCard item={item} />
                    </div>
                  ))}
                </ScrollableSection>
              </section>

              {/* Courses Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Khóa học nổi bật</h2>
                  <div className="flex items-center text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium group">
                    <span>Xem tất cả</span>
                    <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <ScrollableSection title="">
                  {newsData.map((item: any, index: number) => (
                    <div key={item.newsID || index} className="transform transition-all duration-300 hover:scale-105">
                      <NewsCard item={item} />
                    </div>
                  ))}
                </ScrollableSection>
              </section>

              {/* Newsletter Signup */}
              <section className="relative py-16 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-700/20"></div>
                <div className="relative text-center">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Nhận thông tin mới nhất
                  </h3>
                  <p className="text-emerald-50 mb-8 text-lg">
                    Đăng ký để không bỏ lỡ những tin tức và phân tích crypto mới nhất
                  </p>
                  <div className="max-w-md mx-auto flex gap-4">
                    <input
                      type="email"
                      placeholder="Nhập email của bạn"
                      className="flex-1 px-4 py-3 rounded-full bg-white border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    <Button className="bg-white text-emerald-600 hover:bg-gray-50 px-8 py-3 rounded-full font-semibold">
                      Đăng ký
                    </Button>
                  </div>
                </div>
              </section>
            </div>
            
            {/* Sidebar - Trading Widget */}
            <div className="lg:col-span-1 hidden lg:block">
              <TradingWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}