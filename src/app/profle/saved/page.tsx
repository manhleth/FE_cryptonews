"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bookmark, Link2, Search, Grid3X3, LayoutList, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Input } from "@/components/ui/input";

interface SavedItem {
  newsID: number;
  header: string;
  title: string;
  links: string | null;
  timeReading: string;
  userName: string | null;
  userAvartar: string | null;
  timeAgo: string | null;
  imagesLink: string;
}

export default function SavedPage() {
  // State lưu danh sách "Posts" (categoryID=1) & tổng số
  const [posts, setPosts] = useState<SavedItem[]>([]);
  const [postsTotal, setPostsTotal] = useState<number>(0);
  // State lưu danh sách "Courses" (categoryID=2) & tổng số
  const [courses, setCourses] = useState<SavedItem[]>([]);
  const [coursesTotal, setCoursesTotal] = useState<number>(0);
  const token = useAuth();
  // State để biết tab hiện tại (posts | courses)
  const [activeTab, setActiveTab] = useState<"posts" | "courses">("posts");
  // State để lưu kết quả tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState<SavedItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<SavedItem[]>([]);
  // State để chuyển đổi giữa chế độ xem lưới và danh sách
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // State để theo dõi việc tải dữ liệu
  const [loading, setLoading] = useState(true);

  async function fetchSavedPosts() {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/Saved/GetListSavedPostByUser?categoryID=1", {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const text = await response.text();
      if (text) {
        const data = JSON.parse(text);
        if (data.statusCode === 1 && data.data) {
          setPosts(data.data.listSaved);
          setFilteredPosts(data.data.listSaved);
          setPostsTotal(data.data.total);
        }
      } else {
        console.error("API trả về dữ liệu rỗng");
      }

    } catch (error) {
      console.error("Error fetching saved posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBookmark(newsID: number) {
    try {
      const response = await fetch(`http://localhost:5000/api/Saved/AddOrRemoveSaved?newsID=${newsID}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error toggling saved item");
      }

      if (activeTab === "posts") {
        // Xóa bài viết khỏi danh sách đã lưu
        setPosts(posts.filter(post => post.newsID !== newsID));
        setFilteredPosts(filteredPosts.filter(post => post.newsID !== newsID));
        setPostsTotal(prev => prev - 1);
      } else {
        // Xóa khóa học khỏi danh sách đã lưu
        setCourses(courses.filter(course => course.newsID !== newsID));
        setFilteredCourses(filteredCourses.filter(course => course.newsID !== newsID));
        setCoursesTotal(prev => prev - 1);
      }
    } catch (error) {
      console.error("Error toggling saved item:", error);
    }
  }

  // Gọi API lấy danh sách Saved Courses
  async function fetchSavedCourses() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/Saved/GetListSavedPostByUser?categoryID=2", {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      });
      
      const data = await res.json();
      if (data.statusCode === 1 && data.data) {
        setCourses(data.data.listSaved);
        setFilteredCourses(data.data.listSaved);
        setCoursesTotal(data.data.total);
      }
    } catch (error) {
      console.error("Error fetching saved courses:", error);
    } finally {
      setLoading(false);
    }
  }

  // Lần đầu vào trang, fetch "Posts" mặc định
  useEffect(() => {
    if (token?.token) {
      fetchSavedPosts();
    }
  }, [token]);

  // Hàm xử lý khi đổi tab
  function handleTabChange(value: string) {
    if (value === "posts") {
      setActiveTab("posts");
      setSearchTerm("");
      // Nếu chưa load posts thì fetch
      if (posts.length === 0) {
        fetchSavedPosts();
      }
    } else {
      setActiveTab("courses");
      setSearchTerm("");
      // Tương tự, fetch courses
      if (courses.length === 0) {
        fetchSavedCourses();
      }
    }
  }

  // Xử lý tìm kiếm
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPosts(posts);
      setFilteredCourses(courses);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    
    // Lọc bài viết
    const newFilteredPosts = posts.filter(post => 
      post.header?.toLowerCase().includes(searchTermLower) || 
      post.title?.toLowerCase().includes(searchTermLower) ||
      post.userName?.toLowerCase().includes(searchTermLower)
    );
    setFilteredPosts(newFilteredPosts);
    
    // Lọc khóa học
    const newFilteredCourses = courses.filter(course => 
      course.header?.toLowerCase().includes(searchTermLower) || 
      course.title?.toLowerCase().includes(searchTermLower) ||
      course.userName?.toLowerCase().includes(searchTermLower)
    );
    setFilteredCourses(newFilteredCourses);
  }, [searchTerm, posts, courses]);

  // Hàm định dạng thời gian đọc
  const formatReadingTime = (time: string) => {
    if (!time) return "N/A";
    return `${time} phút đọc`;
  }

  // Hàm hiển thị khi không có bài viết
  const renderEmptyState = (type: 'posts' | 'courses') => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
        <Bookmark className="w-8 h-8 text-emerald-500/40" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có {type === 'posts' ? 'bài viết' : 'khóa học'} nào được lưu</h3>
      <p className="text-gray-500 mb-6 max-w-md">
        {type === 'posts' 
          ? 'Lưu các bài viết yêu thích để đọc sau và tham khảo khi cần.'
          : 'Lưu các khóa học bạn quan tâm để truy cập sau hoặc theo dõi tiến độ học tập.'}
      </p>
      <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
        <Link href="/">
          Khám phá {type === 'posts' ? 'bài viết' : 'khóa học'}
        </Link>
      </Button>
    </div>
  );

  // Render Grid Items
  const renderGridItems = (items: SavedItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Link href={`/news/${item.newsID}`} key={item.newsID}>
          <div className="group border border-gray-200 hover:border-emerald-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md bg-white h-full flex flex-col">
            {/* Ảnh đại diện bài viết */}
            <div className="relative w-full h-52 overflow-hidden">
              <img
                src={item.imagesLink || "/images/news/placeholder.jpg"}
                alt={item.header}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            
            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
              {/* Thông tin người đăng */}
              <div className="flex items-center mb-3">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={item.userAvartar || "/api/placeholder/24/24"} alt={item.userName || "Unknown"} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {item.userName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.userName || "Unknown"}</p>
                  <p className="text-xs text-gray-500">{item.timeAgo || "some time ago"}</p>
                </div>
              </div>
              
              {/* Tiêu đề */}
              <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                {item.header}
              </h3>
              
              {/* Mô tả ngắn */}
              <p className="text-sm text-gray-700 line-clamp-3 mb-4 flex-1">
                {item.title}
              </p>
              
              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <span className="inline-flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  {formatReadingTime(item.timeReading)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBookmark(item.newsID);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Remove from saved"
                  >
                    <Bookmark className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  </button>
                  <button
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Share"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); 
                      // Thêm xử lý chia sẻ ở đây
                    }}
                  >
                    <Link2 className="w-4 h-4 text-gray-400 hover:text-emerald-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  // Render List Items
  const renderListItems = (items: SavedItem[]) => (
    <div className="space-y-4">
      {items.map((item) => (
        <Link href={`/news/${item.newsID}`} key={item.newsID}>
          <div className="flex gap-4 p-4 border border-gray-200 hover:border-emerald-200 rounded-xl bg-white hover:shadow-md transition-all duration-300 group">
            {/* Ảnh đại diện */}
            <div className="relative w-40 h-28 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={item.imagesLink || "/images/news/placeholder.jpg"}
                alt={item.header}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Tiêu đề */}
              <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                {item.header}
              </h3>
              
              {/* Mô tả ngắn */}
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                {item.title}
              </p>
              
              {/* Thông tin tác giả và thao tác */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={item.userAvartar || "/api/placeholder/24/24"} alt={item.userName || "Unknown"} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                      {item.userName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500">{item.userName || "Unknown"}</span>
                  <span className="mx-2 text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{formatReadingTime(item.timeReading)}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBookmark(item.newsID);
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-100"
                    aria-label="Remove from saved"
                  >
                    <Bookmark className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  </button>
                  <button
                    className="p-1.5 rounded-full hover:bg-gray-100"
                    aria-label="Share"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Thêm xử lý chia sẻ ở đây
                    }}
                  >
                    <Link2 className="w-4 h-4 text-gray-400 hover:text-emerald-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header phần Saved với tùy chọn xem và tìm kiếm */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bài viết đã lưu</h1>
          <p className="text-gray-600 mt-1">
            {activeTab === "posts" 
              ? `${postsTotal} bài viết`
              : `${coursesTotal} khóa học`}
          </p>
        </div>

        <div className="flex gap-3">
          {/* Tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full md:w-60 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Chế độ xem */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${viewMode === "grid" 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"}`}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${viewMode === "list" 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"}`}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs cho Posts và Courses */}
      <Tabs
        defaultValue="posts"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <div className="border-b border-gray-200 mb-6">
          <TabsList className="bg-transparent space-x-8">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none bg-transparent px-0 rounded-none text-base font-normal"
            >
              Bài viết
            </TabsTrigger>
            <TabsTrigger
              value="courses"
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none bg-transparent px-0 rounded-none text-base font-normal text-gray-500"
            >
              Khóa học
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab "Posts" */}
        <TabsContent value="posts" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            renderEmptyState('posts')
          ) : (
            viewMode === "grid" 
              ? renderGridItems(filteredPosts)
              : renderListItems(filteredPosts)
          )}
        </TabsContent>

        {/* Tab "Courses" */}
        <TabsContent value="courses" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            renderEmptyState('courses')
          ) : (
            viewMode === "grid" 
              ? renderGridItems(filteredCourses)
              : renderListItems(filteredCourses)
          )}
        </TabsContent>
      </Tabs>

      {/* Phân trang (có thể bổ sung sau) */}
      {(activeTab === "posts" && filteredPosts.length > 0) || 
       (activeTab === "courses" && filteredCourses.length > 0) ? (
        <div className="mt-8 flex justify-center">
          <p className="text-sm text-gray-500">
            Hiện thị tất cả {activeTab === "posts" ? filteredPosts.length : filteredCourses.length} kết quả
          </p>
        </div>
      ) : null}
    </div>
  );
}