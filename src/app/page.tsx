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
import Link from 'next/link';

// Định nghĩa interface cho dữ liệu tin tức
interface NewsItem {
  newsID: number;
  title: string;
  content: string;
  imagesLink: string;
  userName: string;
  avatar: string;
  timeReading: number;
  categoryId: number;
  childrenCategoryID?: number;
}

// Cấu hình các section với category ID tương ứng
const SECTIONS_CONFIG = [
  {
    id: 'featured',
    title: 'Bài viết nổi bật',
    categoryId: 2, // ID danh mục cho bài viết nổi bật
    linkTo: '/category/2'
  },
  {
    id: 'latest',
    title: 'Tin tức mới nhất', 
    categoryId: 1, // ID danh mục cho tin tức
    linkTo: '/category/1'
  },
  {
    id: 'knowledge',
    title: 'Kiến thức',
    categoryId: 4, // ID danh mục cho kiến thức
    linkTo: '/category/4'
  },
  {
    id: 'analysis',
    title: 'Phân tích thị trường',
    categoryId: 3, // ID danh mục cho phân tích
    linkTo: '/category/3'
  },
  {
    id: 'airdrop',
    title: 'Airdrop & Retroactive',
    categoryId: 5, // ID danh mục cho airdrop
    linkTo: '/category/5'
  }
];

export default function Home() {
  // State cho từng section
  const [sectionsData, setSectionsData] = useState<{[key: string]: NewsItem[]}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllSectionsData = async () => {
      try {
        setLoading(true);
        
        // Tạo array các promise để fetch dữ liệu cho từng section
        const fetchPromises = SECTIONS_CONFIG.map(async (section) => {
          try {
            const response = await fetch(
              `http://localhost:5000/api/News/GetNewsByCategoryTop?category=${section.categoryId}`
            );
            const data = await response.json();
            
            return {
              sectionId: section.id,
              data: data.statusCode === 1 ? data.data : []
            };
          } catch (err) {
            console.error(`Error fetching data for section ${section.id}:`, err);
            return {
              sectionId: section.id,
              data: []
            };
          }
        });

        // Chờ tất cả request hoàn thành
        const results = await Promise.all(fetchPromises);
        
        // Tạo object chứa dữ liệu cho từng section
        const newSectionsData: {[key: string]: NewsItem[]} = {};
        results.forEach(result => {
          newSectionsData[result.sectionId] = result.data;
        });
        
        setSectionsData(newSectionsData);
      } catch (err) {
        console.error("Error fetching sections data:", err);
        setError("Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchAllSectionsData();
  }, []);

  // Component để render từng section
  const SectionComponent = ({ config }: { config: typeof SECTIONS_CONFIG[0] }) => {
    const sectionData = sectionsData[config.id] || [];
    
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{config.title}</h2>
          <Link href={config.linkTo}>
            <div className="flex items-center text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium group transition-colors">
              <span>Xem tất cả</span>
              <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
        
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : sectionData.length > 0 ? (
          <ScrollableSection title="">
            {sectionData.map((item: NewsItem, index: number) => (
              <div key={item.newsID || index} className="transform transition-all duration-300 hover:scale-105">
                <NewsCard
                  item={{
                    id: item.newsID,
                    title: item.title,
                    author: item.userName || "",
                    timeAgo: "", // Provide actual value if available
                    readTime: item.timeReading ? `${item.timeReading} phút` : "",
                    image: item.imagesLink || "",
                    excerpt: item.content?.slice(0, 100) || "",
                    userName: item.userName || "",
                    CreatedDate: "", // Provide actual value if available
                    timeReading: item.timeReading ? `${item.timeReading} phút` : "",
                    header: "", // Provide actual value if available
                    newsID: item.newsID,
                    imagesLink: item.imagesLink || "",
                    userAvartar: item.avatar || "",
                  }}
                />
              </div>
            ))}
          </ScrollableSection>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Chưa có bài viết nào trong danh mục này</p>
          </div>
        )}
      </section>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="flex justify-center">
              <Link href="/category/4">
                <Button size="default" className="bg-white text-emerald-600 hover:bg-gray-50 px-6 py-2 rounded-full font-semibold flex items-center">
                  KIẾN THỨC
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Takes 2/3 of space */}
            <div className="lg:col-span-2 space-y-16">
              {/* Render tất cả các section dựa trên config */}
              {SECTIONS_CONFIG.map((config) => (
                <SectionComponent key={config.id} config={config} />
              ))}

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