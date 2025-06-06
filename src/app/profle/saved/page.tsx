"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bookmark, Link2, Search, Grid3X3, LayoutList, EyeOff, Filter, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  categoryId?: number;
  categoryName?: string;
  childrenCategoryId?: number;
  createdDate?: string;
}

interface CategoryStatistic {
  categoryId: number;
  categoryName: string;
  count: number;
  latestSavedDate: string;
}

interface SavedResponse {
  savedPosts: SavedItem[];
  total: number;
  categoriesCount: number;
  message: string;
}

interface StatisticsResponse {
  totalSavedPosts: number;
  categoriesWithSavedPosts: number;
  categoryStatistics: CategoryStatistic[];
  lastSavedDate: string;
}

export default function SavedPage() {
  // State chính cho tất cả bài viết đã lưu
  const [allSavedPosts, setAllSavedPosts] = useState<SavedItem[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<SavedItem[]>([]);
  const [totalSaved, setTotalSaved] = useState<number>(0);
  const [categoriesCount, setCategoriesCount] = useState<number>(0);
  
  // State cho thống kê
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  
  // State cho filter và search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableCategories, setAvailableCategories] = useState<CategoryStatistic[]>([]);
  
  // State cho UI
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "category" | "stats">("all");
  
  const token = useAuth();

  // Fetch tất cả bài viết đã lưu
  async function fetchAllSavedPosts() {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/Saved/GetAllSavedPosts", {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.statusCode === 1 && data.data) {
        const savedData: SavedResponse = data.data;
        setAllSavedPosts(savedData.savedPosts);
        setFilteredPosts(savedData.savedPosts);
        setTotalSaved(savedData.total);
        setCategoriesCount(savedData.categoriesCount);
        
        // Extract unique categories for filter
        const categories = Array.from(
          new Map(
            savedData.savedPosts.map(post => [
              post.categoryId, 
              { categoryId: post.categoryId!, categoryName: post.categoryName!, count: 0 }
            ])
          ).values()
        ) as CategoryStatistic[];
        
        // Count posts per category
        categories.forEach(cat => {
          cat.count = savedData.savedPosts.filter(post => post.categoryId === cat.categoryId).length;
        });
        
        setAvailableCategories(categories.sort((a, b) => b.count - a.count));
      }
    } catch (error) {
      console.error("Error fetching all saved posts:", error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch thống kê
  async function fetchStatistics() {
    try {
      const response = await fetch("http://localhost:5000/api/Saved/GetSavedPostsStatistics", {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.statusCode === 1) {
          setStatistics(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }

  // Fetch bài viết theo category
  async function fetchSavedPostsByCategory(categoryId?: number) {
    setLoading(true);
    try {
      const url = categoryId 
        ? `http://localhost:5000/api/Saved/GetSavedPostsByCategory?categoryId=${categoryId}`
        : "http://localhost:5000/api/Saved/GetSavedPostsByCategory";
        
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.statusCode === 1 && data.data) {
          setFilteredPosts(data.data.listSaved);
        }
      }
    } catch (error) {
      console.error("Error fetching posts by category:", error);
    } finally {
      setLoading(false);
    }
  }

  // Handle bookmark toggle
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

      // Remove from current view
      setAllSavedPosts(prev => prev.filter(post => post.newsID !== newsID));
      setFilteredPosts(prev => prev.filter(post => post.newsID !== newsID));
      setTotalSaved(prev => prev - 1);
      
      // Update statistics
      fetchStatistics();
    } catch (error) {
      console.error("Error toggling saved item:", error);
    }
  }

  // Initial load
  useEffect(() => {
    if (token?.token) {
      fetchAllSavedPosts();
      fetchStatistics();
    }
  }, [token]);

  // Handle search and filter
  useEffect(() => {
    let filtered = allSavedPosts;

    // Filter by category
    if (selectedCategory !== "all") {
      const categoryId = parseInt(selectedCategory);
      filtered = filtered.filter(post => post.categoryId === categoryId);
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.header?.toLowerCase().includes(searchTermLower) || 
        post.title?.toLowerCase().includes(searchTermLower) ||
        post.userName?.toLowerCase().includes(searchTermLower) ||
        post.categoryName?.toLowerCase().includes(searchTermLower)
      );
    }

    setFilteredPosts(filtered);
  }, [searchTerm, selectedCategory, allSavedPosts]);

  // Handle tab change
  function handleTabChange(value: string) {
    setActiveTab(value as "all" | "category" | "stats");
    setSearchTerm("");
    setSelectedCategory("all");
    
    if (value === "stats") {
      setShowStatistics(true);
      fetchStatistics();
    } else {
      setShowStatistics(false);
    }
  }

  // Format reading time
  const formatReadingTime = (time: string) => {
    if (!time) return "N/A";
    return time.includes("minutes") ? time : `${time} phút đọc`;
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  }

  // Empty state component
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
        <Bookmark className="w-8 h-8 text-emerald-500/40" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm || selectedCategory !== "all" 
          ? "Không tìm thấy bài viết nào" 
          : "Chưa có bài viết nào được lưu"}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md">
        {searchTerm || selectedCategory !== "all"
          ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc category."
          : "Lưu các bài viết yêu thích để đọc sau và tham khảo khi cần."}
      </p>
      {!searchTerm && selectedCategory === "all" && (
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link href="/">Khám phá bài viết</Link>
        </Button>
      )}
    </div>
  );

  // Statistics component
  const renderStatistics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Tổng bài viết đã lưu</p>
              <p className="text-3xl font-bold">{statistics?.totalSavedPosts || 0}</p>
            </div>
            <Bookmark className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Số categories</p>
              <p className="text-3xl font-bold">{statistics?.categoriesWithSavedPosts || 0}</p>
            </div>
            <Filter className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Lưu gần nhất</p>
              <p className="text-lg font-semibold">
                {statistics?.lastSavedDate ? formatDate(statistics.lastSavedDate) : "N/A"}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Phân bố theo danh mục</h3>
        <div className="space-y-3">
          {statistics?.categoryStatistics?.map((stat, index) => (
            <div key={stat.categoryId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-emerald-500' :
                  index === 1 ? 'bg-blue-500' :
                  index === 2 ? 'bg-purple-500' : 'bg-gray-400'
                }`}></div>
                <span className="font-medium">{stat.categoryName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stat.count} bài viết</Badge>
                <span className="text-sm text-gray-500">
                  {formatDate(stat.latestSavedDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Grid view component
  const renderGridItems = (items: SavedItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Link href={`/news/${item.newsID}`} key={item.newsID}>
          <div className="group border border-gray-200 hover:border-emerald-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md bg-white h-full flex flex-col">
            {/* Image */}
            <div className="relative w-full h-52 overflow-hidden">
              <img
                src={item.imagesLink || "/images/news/placeholder.jpg"}
                alt={item.header}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Category badge */}
              {item.categoryName && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    {item.categoryName}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
              {/* Author info */}
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
              
              {/* Title */}
              <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                {item.header}
              </h3>
              
              {/* Description */}
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

  // List view component  
  const renderListItems = (items: SavedItem[]) => (
    <div className="space-y-4">
      {items.map((item) => (
        <Link href={`/news/${item.newsID}`} key={item.newsID}>
          <div className="flex gap-4 p-4 border border-gray-200 hover:border-emerald-200 rounded-xl bg-white hover:shadow-md transition-all duration-300 group">
            {/* Image */}
            <div className="relative w-40 h-28 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={item.imagesLink || "/images/news/placeholder.jpg"}
                alt={item.header}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Category and title */}
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-bold text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors">
                  {item.header}
                </h3>
                {item.categoryName && (
                  <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                    {item.categoryName}
                  </Badge>
                )}
              </div>
              
              {/* Description */}
              <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                {item.title}
              </p>
              
              {/* Author info and actions */}
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bài viết đã lưu</h1>
          <p className="text-gray-600 mt-1">
            {totalSaved} bài viết trong {categoriesCount} danh mục
          </p>
        </div>

        {/* Controls */}
        {!showStatistics && (
          <div className="flex gap-3 flex-wrap">
            {/* Category filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-40 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Tất cả danh mục</option>
                {availableCategories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId.toString()}>
                    {category.categoryName} ({category.count})
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Search */}
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

            {/* View mode */}
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
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
        <div className="border-b border-gray-200 mb-6">
          <TabsList className="bg-transparent space-x-8">
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none bg-transparent px-0 rounded-none text-base font-normal"
            >
              Tất cả bài viết
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none bg-transparent px-0 rounded-none text-base font-normal text-gray-500"
            >
              Thống kê
            </TabsTrigger>
          </TabsList>
        </div>

        {/* All posts tab */}
        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-4">
              {/* Results info */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Hiển thị {filteredPosts.length} trong số {totalSaved} bài viết
                  {selectedCategory !== "all" && (
                    <span className="ml-1">
                      • Danh mục: <span className="font-medium">
                        {availableCategories.find(c => c.categoryId.toString() === selectedCategory)?.categoryName}
                      </span>
                    </span>
                  )}
                  {searchTerm && (
                    <span className="ml-1">
                      • Tìm kiếm: <span className="font-medium">"{searchTerm}"</span>
                    </span>
                  )}
                </span>
                
                {(searchTerm || selectedCategory !== "all") && (
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              {/* Posts grid/list */}
              {viewMode === "grid" ? renderGridItems(filteredPosts) : renderListItems(filteredPosts)}
            </div>
          )}
        </TabsContent>

        {/* Statistics tab */}
        <TabsContent value="stats" className="mt-6">
          {statistics ? renderStatistics() : (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}