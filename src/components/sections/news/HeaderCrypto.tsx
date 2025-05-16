"use client"
import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Settings } from 'lucide-react';
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
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import Image from "next/image";
import Link from "next/link";

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

  // ------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------
  
  // User state
  const [user, setUser] = useState(initialUser);
  
  // Categories state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  // USER MANAGEMENT FUNCTIONS
  // ------------------------------------
  
  // Update user from session storage
  const updateUserFromSession = () => {
    const storedUser = sessionStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  // Listen for user session changes
  useEffect(() => {
    // Initial user update
    updateUserFromSession();

    // Listen for storage changes (cross-tab)
    window.addEventListener("storage", updateUserFromSession);
    
    // Listen for custom storage changes (same tab)
    window.addEventListener("storageChange", updateUserFromSession);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("storage", updateUserFromSession);
      window.removeEventListener("storageChange", updateUserFromSession);
    };
  }, []);

  // ------------------------------------
  // CATEGORIES MANAGEMENT
  // ------------------------------------
  
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

  // Navigate to admin panel
  const handleAdmin = () => {
    router.push('/admin/login');
  };

  // ------------------------------------
  // AUTHENTICATION HANDLERS
  // ------------------------------------
  
  // Handle user sign out
  const handleSignOut = () => {
    const user = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    if (user || token) {
      // Clear session storage
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      
      // Update state and redirect
      setUser(null);
      router.push("/User/Login");
    } else {
      router.push("/User/Login");
      console.log("Không có thông tin đăng nhập để xóa.");
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
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png"
                alt="Logo"
                width={180}      // Từ 120px tăng lên 180px
                height={60}      // Từ 40px tăng lên 60px
                className="h-15 w-auto hover:opacity-80 transition-opacity"  // Từ h-10 (40px) lên h-15 (60px)
                priority
                />
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
                selectedCategoryId === null ? 'border-b border-gray-900' : ''
              }`} 
              onClick={handleHomeClick}
            >
              Home
            </a>
            
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

          {/* ================== RIGHT SECTION - SETTINGS & USER ================== */}
          <div className="flex items-center gap-4">
            
            {/* Settings Dropdown */}
            <div className="relative group">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
              
              {/* Theme Switcher Dropdown */}
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <ThemeSwitcher />
              </div>
            </div>
            
            {/* User Avatar/Sign In */}
            {user ? (
              /* User is logged in - Show avatar dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={user.avatar || "/default-avatar.png"} alt={user.fullname} />
                    <AvatarFallback>{user.fullname.charAt(0)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {/* User Info */}
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullname}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* User Actions */}
                  <DropdownMenuItem onClick={handleSaved}>
                    Saved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAdmin}>
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  {/* Sign Out */}
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    Sign out
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