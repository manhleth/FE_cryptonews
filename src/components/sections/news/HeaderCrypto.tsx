"use client"
import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Pencil, LogOut, Shield, Bookmark, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ====================================
// TYPE DEFINITIONS
// ====================================

interface NewsItem {
  newsID: number;
  header: string;
  title: string;
  links: string;
  timeReading: string;
  userName: string | null;
  userAvartar: string | null;
  timeAgo: string | null;
  imagesLink: string | null;
}

interface Category {
  categoryId: number;
  categoryName: string;
}

// ====================================
// MAIN HEADER COMPONENT
// ====================================

export const HeaderCrypto = () => {
  // ------------------------------------
  // HOOKS & ROUTER
  // ------------------------------------
  const router = useRouter();
  const pathname = usePathname();
  const { user: initialUser } = useUser();
  const { user: authUser, token, logout } = useAuth();

  // ------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------
  
  // User state
  const [user, setUser] = useState(authUser || initialUser);
  
  // Categories state
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Search state
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<NewsItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Search refs
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------
  // DEBUG FUNCTIONS
  // ------------------------------------
  
  const debugAuthState = () => {
    console.log("=== AUTH DEBUG ===");
    console.log("authUser from context:", authUser);
    console.log("user state:", user);
    console.log("sessionStorage user:", sessionStorage.getItem("user"));
    console.log("sessionStorage token:", sessionStorage.getItem("token"));
    console.log("pathname:", pathname);
    console.log("==================");
  };

  const checkAuthState = () => {
    const hasAuthUser = !!authUser;
    const hasSessionUser = !!sessionStorage.getItem("user");
    const hasSessionToken = !!sessionStorage.getItem("token");
    
    console.log("Auth state check:", {
      hasAuthUser,
      hasSessionUser, 
      hasSessionToken,
      currentUser: user
    });
    
    return hasAuthUser || hasSessionUser || hasSessionToken;
  };

  // USER MANAGEMENT FUNCTIONS
  
  // Update user from auth context and session storage
  useEffect(() => {
    const updateUserState = () => {
      // Ưu tiên authUser từ AuthContext
      if (authUser) {
        console.log("Setting user from AuthContext:", authUser);
        setUser(authUser);
        return;
      }
      
      // Fallback về sessionStorage
      const storedUser = sessionStorage.getItem("user");
      const storedToken = sessionStorage.getItem("token");
      
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("Setting user from sessionStorage:", parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Error parsing stored user:", error);
          // Nếu data bị corrupt, xóa luôn
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("token");
          setUser(null);
        }
      } else {
        console.log("No user found, setting to null");
        setUser(null);
      }
    };
    
    updateUserState();
  }, [authUser]);

  // Listen for user session changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Chỉ xử lý khi không có authUser từ context
      if (!authUser) {
        const storedUser = sessionStorage.getItem("user");
        const storedToken = sessionStorage.getItem("token");
        
        if (!storedUser || !storedToken) {
          console.log("Storage cleared, logging out user");
          setUser(null);
        } else {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error("Error parsing user from storage:", error);
            setUser(null);
          }
        }
      }
    };

    const handleCustomStorageChange = (e: Event) => {
      // Chỉ xử lý khi không có authUser từ context
      if (!authUser) {
        const storedUser = sessionStorage.getItem("user");
        const storedToken = sessionStorage.getItem("token");
        
        if (!storedUser || !storedToken) {
          console.log("Storage cleared, logging out user");
          setUser(null);
        } else {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error("Error parsing user from storage:", error);
            setUser(null);
          }
        }
      }
    };

    // Listen for storage changes
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("storageChange", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("storageChange", handleCustomStorageChange);
    };
  }, [authUser]);

  // Kiểm tra user có phải admin không
  const isAdmin = user?.roleId === 1;
  const isUser = user?.roleId === 0;

  // CATEGORIES MANAGEMENT
  
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/Category/GetCategoryTop5');
        if (!response.ok) {
          throw new Error('Không thể lấy dữ liệu từ API');
        }
        const data = await response.json();
        setCategories(data.data || []);
        
        // Update selected category based on current path
        if (pathname) {
          const categoryIdMatch = pathname.match(/\/category\/(\d+)/);
          if (categoryIdMatch && categoryIdMatch[1]) {
            setSelectedCategoryId(parseInt(categoryIdMatch[1]));
          } else if (pathname === '/') {
            setSelectedCategoryId(null);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [pathname]);

  // ------------------------------------
  // SEARCH FUNCTIONALITY
  // ------------------------------------
  
  // Focus search input when dialog opens
  useEffect(() => {
    if (isSearchDialogOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchDialogOpen]);

  // Handle search input with debouncing
  const handleSearchInput = (e: any) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Clear results if empty
    if (value.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Set debounced search (1 second delay)
    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 1000);
  };

  // Perform actual search API call
  const performSearch = async (keyword: any) => {
    if (!keyword.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/News/GetNewsByKeyWord?keyWord=${encodeURIComponent(keyword)}`
      );
      if (!response.ok) {
        throw new Error('Lỗi khi tìm kiếm');
      }
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Open search dialog
  const handleSearchClick = () => {
    setIsSearchDialogOpen(true);
  };

  // Close search dialog and reset state
  const closeSearchDialog = () => {
    setIsSearchDialogOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
  };

  // Handle news item click in search results
  const handleNewsClick = (newsId: number) => {
    router.push(`/news/${newsId}`);
    closeSearchDialog();
  };

  // ------------------------------------
  // NAVIGATION HANDLERS
  // ------------------------------------
  
  // Handle category navigation
  const handleCategoryClick = (categoryId: any) => {
    setSelectedCategoryId(categoryId);
    router.push(`/category/${categoryId}`);
  };

  // Handle home navigation
  const handleHomeClick = (e: any) => {
    e.preventDefault();
    setSelectedCategoryId(null);
    router.push('/');
  };

  // Navigate to saved posts
  const handleSaved = () => {
    router.push("/profle/saved");
  };

  // Navigate directly to admin panel
  const handleAdmin = () => {
    router.push('/admin/accounts');
  };

  // ------------------------------------
  // AUTHENTICATION HANDLERS
  // ------------------------------------
  
  // Handle user sign out - FIXED VERSION
  const handleSignOut = async () => {
    try {
      console.log("Bắt đầu đăng xuất...");
      
      // 1. Gọi logout từ AuthContext trước (nếu có)
      if (logout) {
        await logout();
        console.log("Đã gọi logout từ AuthContext");
      }
      
      // 2. Xóa tất cả dữ liệu trong sessionStorage
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      console.log("Đã xóa sessionStorage");
      
      // 3. Dispatch custom event để thông báo cho các component khác
      window.dispatchEvent(new Event('storageChange'));
      
      // 4. Reset state local
      setUser(null);
      console.log("Đã reset user state");
      
      // 5. Chuyển hướng
      router.push("/User/Login");
      console.log("Đã chuyển hướng đến trang login");
      
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      
      // Nếu có lỗi, vẫn thực hiện cleanup cơ bản
      sessionStorage.clear(); // Xóa toàn bộ sessionStorage
      setUser(null);
      router.push("/User/Login");
    }
  };

  // Handle sign in navigation
  const handleSignIn = () => {
    router.push("/User/Login");
  };

  // ------------------------------------
  // RENDER COMPONENT
  // ------------------------------------
  
  return (
    <header className="w-full">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* ================== LEFT SECTION - LOGO & SEARCH ================== */}
          <div className="flex items-center flex-1 gap-8">
            
            {/* Logo - Image only, link to home */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">₿</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">↗</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-emerald-600">ALL-IN</span>
                <span className="text-sm font-medium text-emerald-600 tracking-wider">CRYPTOINSIGHTS</span>
                {/* <img src="/images/logo.png" alt="ALL-IN Logo" className="h-8 w-auto" /> */}
              </div>
            </Link>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-50"
                onClick={handleSearchClick}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* ================== MIDDLE SECTION - NAVIGATION ================== */}
          <nav className="hidden md:flex items-center gap-6 mx-4">
            {/* Home Link */}
            <a 
              href="/" 
              className={`text-gray-600 hover:text-gray-900 pb-1 ${
                selectedCategoryId === null && pathname === '/' ? 'border-b border-gray-900' : ''
              }`} 
              onClick={handleHomeClick}
            >
              Home
            </a>
            
            {/* Trading Link - chỉ hiển thị khi đã đăng nhập */}
            {user && (
              <Link 
                href="/trading"
                className={`text-gray-600 hover:text-gray-900 pb-1 ${
                  pathname === '/trading' ? 'border-b border-gray-900' : ''
                }`}
              >
                Giao dịch
              </Link>
            )}
            
            {/* Watchlist Link - chỉ hiển thị khi đã đăng nhập */}
            {user && (
              <Link 
                href="/watchlist"
                className={`text-gray-600 hover:text-gray-900 pb-1 flex items-center gap-1 ${
                  pathname === '/watchlist' ? 'border-b border-gray-900' : ''
                }`}
              >
                Watchlist
              </Link>
            )}
            {/* Categories Navigation */}
            {loading ? (
              <span>Đang tải...</span>
            ) : error ? (
              <span>Lỗi: {error}</span>
            ) : (
              categories.map((category: any) => (
                <a
                  key={category.categoryId}
                  href={`/category/${category.categoryId}`}
                  className={`text-gray-600 hover:text-gray-900 pb-1 ${
                    selectedCategoryId === category.categoryId ? 'border-b border-gray-900' : ''
                  }`}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    handleCategoryClick(category.categoryId);
                  }}
                >
                  {category.categoryName}
                </a>
              ))
            )}
          </nav>

          {/* ================== RIGHT SECTION - USER ONLY ================== */}
          <div className="flex items-center gap-4">
            
            {/* User Avatar/Sign In */}
            {user ? (
              /* User is logged in - Show avatar dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={user.avatar || "/default-avatar.png"} 
                        alt={user.fullname || user.username || "User"} 
                      />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {(user.fullname || user.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  {/* User Info */}
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.fullname || user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isAdmin 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isAdmin ? 'Quản trị viên' : 'Thành viên'}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* User Actions */}
                  <DropdownMenuItem onClick={() => router.push("/profle/edit")}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Chỉnh sửa thông tin
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => router.push("/profle/saved")}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bài viết đã lưu
                  </DropdownMenuItem>

                  {/* Bài viết của tôi - CHỈ HIỂN THỊ CHO ADMIN */}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push("/profle/contributor")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Bài viết của tôi
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Admin Panel - chỉ hiển thị nếu là admin (roleId === 1) */}
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={handleAdmin}>
                        <Shield className="mr-2 h-4 w-4" />
                        Quản trị hệ thống
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* Sign Out */}
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* User not logged in - Show sign in button */
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ================== SEARCH DIALOG OVERLAY ================== */}
      {isSearchDialogOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <ScrollArea className="max-w-7xl mx-auto px-4 py-3 h-screen">
            <div className="max-w-7xl mx-auto mt-2">
              
              {/* Search Header */}
              <div className="flex items-center gap-4">
                {/* Back Button */}
                <button
                  className="p-2 hover:bg-gray-100 rounded-full"
                  onClick={closeSearchDialog}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span className="ml-2">Back</span>
                  </div>
                </button>

                {/* Search Input in Dialog */}
                <div className="relative flex-1">
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search"
                    className="w-1/2 pl-10 pr-4 py-2 rounded-full bg-gray-50"
                    value={searchTerm}
                    onChange={handleSearchInput}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  
                  {/* Clear Search Button */}
                  {searchTerm && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                      onClick={() => {
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search Results */}
              <div className="mt-6">
                {isSearching ? (
                  /* Loading State */
                  <div className="py-4 text-center">Đang tìm kiếm...</div>
                ) : searchTerm && searchResults.length === 0 ? (
                  /* No Results State */
                  <div className="py-4 text-center">Không tìm thấy kết quả</div>
                ) : (
                  /* Results Display */
                  <>
                    {searchResults.length > 0 && (
                      <div className="mb-4 text-gray-500 font-medium">POSTS</div>
                    )}
                    
                    {/* News Items */}
                    <div className="space-y-4">
                      {searchResults.map((news) => (
                        <div
                          key={news.newsID}
                          className="flex gap-4 py-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleNewsClick(news.newsID)}
                        >
                          {/* News Image */}
                          <div className="h-16 w-24 bg-gray-200 rounded-md overflow-hidden">
                            {news.imagesLink ? (
                              <img
                                src={news.imagesLink}
                                alt={news.header}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          
                          {/* News Info */}
                          <div className="flex-1">
                            <h3 className="font-medium text-sm mb-1">{news.header}</h3>
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span>{news.timeAgo || 'recent'}</span>
                              <span>•</span>
                              <span>{news.timeReading} min read</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </header>
  );
};