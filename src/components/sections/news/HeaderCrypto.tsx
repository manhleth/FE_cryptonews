"use client"
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
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


export const HeaderCrypto = () => {
  const router = useRouter();
  const { user: initialUser } = useUser();
  const [user, setUser] = useState(initialUser);
// State để lưu trữ danh sách categories
  const [categories, setCategories] = useState([]);
  // State để theo dõi trạng thái loading
  const [loading, setLoading] = useState(true);
  // State để theo dõi lỗi
  const [error, setError] = useState(null);


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
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/Category/GetCategoryTop5');
        if (!response.ok) {
          throw new Error('Không thể lấy dữ liệu từ API');
        }
        const data = await response.json();
        setCategories(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSaved = () => {
    router.push("/profle/saved")
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
      <header className="w-full bg-white">
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
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
  
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6 mx-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
              {loading ? (
              <span>Đang tải...</span>
            ) : error ? (
              <span>Lỗi: {error}</span>
            ) : (
              categories.map((category: any) => (
                <a
                  key={category.categoryId}
                  href={`/category/${category.categoryId}`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {category.categoryName}
                </a>
              ))
            )}
            </nav>
  
            {/* Settings and Sign In */}
            
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
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
                  <DropdownMenuItem>
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
      </header>
    );
  };
  