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
import { OptimizedTradingWidget } from '@/components/OptimizedTradingWidget';
import Link from 'next/link';

// Định nghĩa interface cho dữ liệu tin tức
interface NewsItem {
  newsID: number;
  title: string;
  content: string;
  imagesLink: string;
  userName: string;
  userAvartar: string; // Đảm bảo tên trường đúng với API
  timeReading: number;
  timeAgo?: string;
  categoryId: number;
  childrenCategoryID?: number;
  header: string; // Đảm bảo có trường header
  createdDate?: string; // Thêm trường createdDate để tính toán thời gian đăng bài  
}

// Cấu hình các section với category ID tương ứng
const SECTIONS_CONFIG = [
  {
    id: 'featured',
    title: 'Bài viết nổi bật',
    // Không cần categoryId nữa, sẽ gọi API riêng
    linkTo: '/category/0',
    isFeatured: true 
  },
  {
    id: 'latest',
    title: 'Tin tức mới nhất', 
    linkTo: '/'
  },
  {
    id: 'knowledge',
    title: 'Kiến thức',
    categoryId: 3, 
    linkTo: '/category/3'
  },
  {
    id: 'analysis',
    title: 'Phân tích thị trường',
    categoryId: 4, 
    linkTo: '/category/4'
  },
  {
    id: 'airdrop',
    title: 'Airdrop & Retroactive',
    categoryId: 2,
    linkTo: '/category/2'
  }
];

export default function Home() {
  // State cho từng section
  const [sectionsData, setSectionsData] = useState<{[key: string]: NewsItem[]}>({});
  const [allNews, setAllNews] = useState<NewsItem[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tính toán thời gian đăng bài
  const calculateTimeAgo = (createdDate: string | undefined): string => {
    if (!createdDate) return "Gần đây";
    
    const created = new Date(createdDate);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
    return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
  };

  useEffect(() => {
    const fetchAllSectionsData = async () => {
      try {
        setLoading(true);
        
        // Fetch bài viết nổi bật
        const fetchFeaturedPromise = fetch(`http://localhost:5000/api/News/GetFeaturedNews`)
          .then(async response => {
            console.log("Featured news response status:", response.status);
            
            if (!response.ok) {
              console.error("Featured news response not OK:", response.status, response.statusText);
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log("Featured news raw response:", text.substring(0, 200) + "...");
            
            try {
              const data = JSON.parse(text);
              console.log("Featured news parsed data:", data);
              
              if (data.statusCode === 1) {
                const newsWithTimeAgo = data.data?.map((item: any) => ({
                  newsID: item.newsId,
                  header: item.header,
                  title: item.title,
                  content: item.content,
                  imagesLink: item.imagesLink,
                  userName: item.userName,
                  userAvartar: item.avatar,
                  timeReading: item.timeReading || 5,
                  categoryId: item.categoryId,
                  childrenCategoryID: item.childrenCategoryId,
                  createdDate: item.createdDate,
                  timeAgo: calculateTimeAgo(item.createdDate)
                })) || [];
                
                return {
                  sectionId: 'featured',
                  data: newsWithTimeAgo
                };
              }
              return {
                sectionId: 'featured',
                data: []
              };
            } catch (parseError) {
              console.error("Error parsing featured news JSON:", parseError);
              console.error("Raw response that failed to parse:", text);
              throw parseError;
            }
          })
          .catch(err => {
            console.error(`Error fetching featured news:`, err);
            return {
              sectionId: 'featured',
              data: []
            };
          });
        
        // Fetch latest news
        const fetchAllNewsPromise = fetch(`http://localhost:5000/api/News/GetNewest`)
          .then(async response => {
            console.log("Latest news response status:", response.status);
            
            if (!response.ok) {
              console.error("Latest news response not OK:", response.status, response.statusText);
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log("Latest news raw response:", text.substring(0, 200) + "...");
            
            try {
              const data = JSON.parse(text);
              console.log("API Response for GetNewest:", data); // Debug log
              
              if (data.statusCode === 1) {
                // Map dữ liệu từ API với các trường đúng
                const newsWithTimeAgo = data.data?.map((item: any) => {
                  console.log("Individual news item:", item); // Debug log cho từng item
                  return {
                    newsID: item.newsId, // Backend trả về newsId
                    header: item.header,
                    title: item.title,
                    content: item.content,
                    imagesLink: item.imagesLink,
                    userName: item.userName, // Backend đã sửa để trả về userName
                    userAvartar: item.avatar, // Backend đã sửa để trả về avatar
                    timeReading: item.timeReading || 5,
                    categoryId: item.categoryId,
                    childrenCategoryID: item.childrenCategoryId,
                    createdDate: item.createdDate,
                    timeAgo: calculateTimeAgo(item.createdDate)
                  };
                }) || [];
                
                console.log("Mapped news data:", newsWithTimeAgo); // Debug log
                setAllNews(newsWithTimeAgo);
                return {
                  sectionId: 'latest',
                  data: newsWithTimeAgo
                };
              }
              return {
                sectionId: 'latest',
                data: []
              };
            } catch (parseError) {
              console.error("Error parsing latest news JSON:", parseError);
              console.error("Raw response that failed to parse:", text);
              throw parseError;
            }
          })
          .catch(err => {
            console.error(`Error fetching all news:`, err);
            return {
              sectionId: 'latest',
              data: []
            };
          });
        
        // Fetch các section khác (có categoryId)
        const fetchPromises = SECTIONS_CONFIG
          .filter(section => section.id !== 'latest' && section.id !== 'featured' && section.categoryId)
          .map(async (section) => {
            try {
              const response = await fetch(
                `http://localhost:5000/api/News/GetNewsByCategoryTop?category=${section.categoryId}`
              );
              
              console.log(`${section.id} response status:`, response.status);
              
              if (!response.ok) {
                console.error(`${section.id} response not OK:`, response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const text = await response.text();
              console.log(`${section.id} raw response:`, text.substring(0, 200) + "...");
              
              try {
                const data = JSON.parse(text);
                console.log(`API Response for ${section.id}:`, data); // Debug log
                
                // Map dữ liệu từ API với các trường đúng
                const newsWithTimeAgo = data.statusCode === 1 
                  ? data.data?.map((item: any) => {
                      console.log(`Individual item for ${section.id}:`, item); // Debug log
                      return {
                        newsID: item.newsID, // API trả về newsID với chữ D viết hoa
                        header: item.header,
                        title: item.title,
                        content: item.title, // Sử dụng title làm content tạm thời
                        imagesLink: item.imagesLink,
                        userName: item.userName, // API trả về userName
                        userAvartar: item.userAvartar, // API trả về userAvartar
                        timeReading: parseInt(item.timeReading) || 5,
                        categoryId: section.categoryId,
                        timeAgo: item.timeAgo || calculateTimeAgo(item.createdDate),
                        createdDate: item.createdDate
                      };
                    }) || []
                  : [];
                
                console.log(`Mapped data for ${section.id}:`, newsWithTimeAgo); // Debug log
                
                return {
                  sectionId: section.id,
                  data: newsWithTimeAgo
                };
              } catch (parseError) {
                console.error(`Error parsing ${section.id} JSON:`, parseError);
                console.error(`Raw response that failed to parse for ${section.id}:`, text);
                throw parseError;
              }
            } catch (err) {
              console.error(`Error fetching data for section ${section.id}:`, err);
              return {
                sectionId: section.id,
                data: []
              };
            }
          });

        // Chờ tất cả request hoàn thành
        const results = await Promise.all([fetchFeaturedPromise, fetchAllNewsPromise, ...fetchPromises]);
        
        // Tạo object chứa dữ liệu cho từng section
        const newSectionsData: {[key: string]: NewsItem[]} = {};
        results.forEach(result => {
          newSectionsData[result.sectionId] = result.data;
        });
        
        console.log("Final sections data:", newSectionsData);
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
    const isFeatured = config.id === 'featured';
    
    return (
      <section className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-8 ${
        isFeatured ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : ''
      }`}>
         <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            {isFeatured && <Star className="w-8 h-8 text-yellow-500 fill-current" />}
            {config.title}
          </h2>
          {/* Hiển thị "Xem tất cả" cho các danh mục khác ngoài "Bài viết nổi bật" và "Tin tức mới nhất" */}
          {config.id !== 'featured' && config.id !== 'latest' && (
            <Link href={config.linkTo}>
              <div className="flex items-center text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium group transition-colors">
                <span>Xem tất cả</span>
                <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}
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
          <div className={isFeatured ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}>
            {isFeatured ? (
              // Layout đặc biệt cho bài viết nổi bật - hiển thị tối đa 2 bài
              sectionData.slice(0, 2).map((item: NewsItem, index: number) => (
                <Link key={item.newsID || index} href={`/news/${item.newsID}`}>
                  <div className="group cursor-pointer h-full">
                    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-yellow-200">
                      <div className="relative h-60 overflow-hidden">
                        <img
                          src={item.imagesLink || "/placeholder/400/250.jpg"}
                          alt={item.header || item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Star size={12} className="fill-current" />
                          Nổi bật
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {item.header || item.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                          {item.content?.slice(0, 150) || item.title?.slice(0, 150)}...
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <img
                              src={item.userAvartar || "/placeholder/20/20"}
                              alt={item.userName}
                              className="w-6 h-6 rounded-full"
                            />
                            <span>{item.userName || "Unknown"}</span>
                          </div>
                          <span>{item.timeReading} phút đọc</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Layout bình thường cho các section khác
              <ScrollableSection title="">
                {sectionData.map((item: NewsItem, index: number) => {
                  console.log(`Rendering item for ${config.id}:`, item); // Debug info
                  return (
                    <div key={item.newsID || index} className="transform transition-all duration-300 hover:scale-105">
                      <NewsCard
                        item={{
                          id: item.newsID,
                          title: item.title || "",
                          author: item.userName || "",
                          timeAgo: item.timeAgo || "Gần đây",
                          readTime: typeof item.timeReading === 'number' ? `${item.timeReading} phút` : "5 phút",
                          image: item.imagesLink || "",
                          excerpt: item.content?.slice(0, 100) || item.title?.slice(0, 100) || "",
                          userName: item.userName || "",
                          CreatedDate: item.createdDate || "",
                          timeReading: typeof item.timeReading === 'number' ? `${item.timeReading}` : "5",
                          header: item.header || item.title || "",
                          newsID: item.newsID,
                          imagesLink: item.imagesLink || "",
                          userAvartar: item.userAvartar || "", // Truyền đúng trường avatar
                        }}
                        hideBookmark={config.id === 'latest'} 
                      />
                    </div>
                  );
                })}
              </ScrollableSection>
            )}
          </div>
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
              <OptimizedTradingWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}