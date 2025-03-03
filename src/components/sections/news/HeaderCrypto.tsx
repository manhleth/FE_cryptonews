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
import path from 'path';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

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


export const HeaderCrypto = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user: initialUser } = useUser();
  const [user, setUser] = useState(initialUser);
  // State để lưu trữ danh sách categories
  const [categories, setCategories] = useState([]);
  // State để theo dõi trạng thái loading
  const [loading, setLoading] = useState(true);
  // State để theo dõi lỗi
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);


  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<NewsItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);


  const updateUserFromSession = () => {
    const storedUser = sessionStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };
  useEffect(() => {
    // Cập nhật user khi component mount
    updateUserFromSession();

    // Lắng nghe sự kiện storage (cho các tab khác)
    window.addEventListener("storage", updateUserFromSession);

    // Lắng nghe sự kiện tùy chỉnh storageChange (cho cùng tab)
    window.addEventListener("storageChange", updateUserFromSession);

    // Cleanup khi component unmount
    return () => {
      window.removeEventListener("storage", updateUserFromSession);
      window.removeEventListener("storageChange", updateUserFromSession);
    };
  }, []);
  const handleNewsClick = (newsId: number) => {
    router.push(`/news/${newsId}`);
    closeSearchDialog();
  };
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/Category/GetCategoryTop5');
        if (!response.ok) {
          throw new Error('Không thể lấy dữ liệu từ API');
        }
        const data = await response.json();
        setCategories(data.data || []);
        if (pathname) {
          const categoryIdMatch = pathname.match(/\/category\/(\d+)/);
          if (categoryIdMatch && categoryIdMatch[1]) {
            setSelectedCategoryId(parseInt(categoryIdMatch[1]));
          } else if (pathname === '/') {
            // Home is selected
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
  }, [path]);
  useEffect(() => {
    if (isSearchDialogOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchDialogOpen]);

  const handleSearchInput = (e: any) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Set a new timeout (2 seconds)
    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 1000);
  };

  const performSearch = async (keyword: any) => {
    if (!keyword.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/News/GetNewsByKeyWord?keyWord=${encodeURIComponent(keyword)}`);
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

  const handleSearchClick = () => {
    setIsSearchDialogOpen(true);
  };

  const closeSearchDialog = () => {
    setIsSearchDialogOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
  };
  const formatTimeAgo = (timeAgo: any) => {
    if (!timeAgo) return "";
    return timeAgo;
  };
  const handleSaved = () => {
    router.push("/profle/saved")
  }
  const handleCategoryClick = (categoryId: any) => {
    setSelectedCategoryId(categoryId);
    router.push(`/category/${categoryId}`);
  };
  const handleHomeClick = (e: any) => {
    e.preventDefault();
    setSelectedCategoryId(null);
    router.push('/');
  };

  const handleAdmin = () => {
    router.push('/admin/login')
  }
  const handleSignOut = () => {
    // Kiểm tra xem có thông tin người dùng trong sessionStorage không
    const user = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    if (user || token) {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      setUser(null); // Đặt lại state user về null để re-render giao diện
      router.push("/User/Login");
    } else {
      router.push("/User/Login");
      console.log("Không có thông tin đăng nhập để xóa.");
    }
  }
  const handleSignIn = () => {
    router.push("/User/Login");
  };
  return (
    <header className="w-full ">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Search */}
          <div className="flex items-center flex-1 gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-yellow-500">98</span>
              <div className="flex flex-col">
                <span className="font-bold">COIN98</span>
                <span className="text-xs text-gray-500">INSIGHTS</span>
              </div>
            </div>

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

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6 mx-4">
            <a href="/" className={`text-gray-600 hover:text-gray-900 pb-1 ${selectedCategoryId === null ? 'border-b border-gray-900' : ''}`} onClick={handleHomeClick}>Home</a>
            {loading ? (
              <span>Đang tải...</span>
            ) : error ? (
              <span>Lỗi: {error}</span>
            ) : (
              categories.map((category: any) => (
                <a
                  key={category.categoryId}
                  href={`/category/${category.categoryId}`}
                  className={`text-gray-600 hover:text-gray-900 pb-1 ${selectedCategoryId === category.categoryId ? 'border-b border-gray-900' : ''
                    }`}
                  onClick={(e) => { e.preventDefault(); handleCategoryClick(category.categoryId) }}
                >
                  {category.categoryName}
                </a>
              ))
            )}
          </nav>

          {/* Settings and Sign In */}

          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
              {/* Dropdown, ẩn mặc định và hiện khi hover vào container group */}
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <ThemeSwitcher />
              </div>
            </div>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={user.avatar || "/default-avatar.png"} alt={user.fullname} />
                    <AvatarFallback>{user.fullname.charAt(0)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullname}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSaved}>
                    Saved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAdmin}>
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
      {isSearchDialogOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <ScrollArea className="max-w-7xl mx-auto px-4 py-3 h-screen">
            <div className="max-w-7xl mx-auto mt-2">
              <div className="flex items-center gap-4">
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
                  {searchTerm && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                      onClick={() => {
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      {/* <X size={16} /> */}
                    </button>
                  )}
                </div>
              </div>
              {/* Search Results */}
              <div className="mt-6">
                {isSearching ? (
                  <div className="py-4 text-center">Đang tìm kiếm...</div>
                ) : searchTerm && searchResults.length === 0 ? (
                  <div className="py-4 text-center">Không tìm thấy kết quả</div>
                ) : (
                  <>
                    {searchResults.length > 0 && (
                      <div className="mb-4 text-gray-500 font-medium">POSTS</div>
                    )}
                    <div className="space-y-4">
                      {searchResults.map((news) => (
                        <div
                          key={news.newsID}
                          className="flex gap-4 py-4 border-b cursor-pointer"
                          onClick={() => handleNewsClick(news.newsID)}
                        >
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
