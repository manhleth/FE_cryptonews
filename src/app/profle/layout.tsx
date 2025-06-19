"use client";
import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Pencil,
  FileText,
  Bookmark,
  ChevronLeft,
  User,
  Lock,
  Shield,
  Crown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bio, setBio] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Set bio based on user role
  useEffect(() => {
    if (user) {
      if (user.roleId === 1) {
        setBio("Quản trị viên");
      } else {
        setBio("Thành viên");
      }
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      router.push('/User/Login');
    }
  }, [user, router]);

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user.roleId === 1;

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - User Profile & Navigation */}
      <div className="w-[280px] border-r border-gray-200 bg-white flex-shrink-0">
        <div className="sticky top-0 p-6 flex flex-col h-screen">
          {/* User Profile Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24 mb-4 border-2 border-white shadow-lg">
                {user?.avatar ? (
                  <AvatarImage 
                    src={user.avatar} 
                    alt={user.fullname || user.username} 
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-emerald-100 text-emerald-800 text-2xl font-semibold">
                    {(user.fullname || user.username)?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Admin Badge */}
              {isAdmin && (
                <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 shadow-lg">
                  <Crown className="w-3 h-3" />
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user.fullname || user.username || "Người dùng"}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center justify-center gap-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isAdmin 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isAdmin ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Quản trị viên
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1" />
                      Thành viên
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />
          
          {/* Navigation Menu */}
          <nav className="space-y-1 flex-1">
            {/* Personal Settings Section */}
            <div className="py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
                Cài đặt cá nhân
              </p>
              
              {/* Thông tin cá nhân */}
              <NavLink 
                href="/profle/edit" 
                icon={<Pencil className="w-4 h-4" />}
                pathname={pathname}
              >
                Chỉnh sửa thông tin
              </NavLink>

              {/* Đã lưu */}
              <NavLink 
                href="/profle/saved" 
                icon={<Bookmark className="w-4 h-4" />}
                pathname={pathname}
              >
                Bài viết đã lưu
              </NavLink>
            </div>

            {/* Content Management Section - Chỉ hiện cho Admin */}
            {isAdmin && (
              <>
                <Separator className="my-3" />
                <div className="py-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
                    Quản lý nội dung
                  </p>
                  
                  <NavLink 
                    href="/profle/contributor" 
                    icon={<FileText className="w-4 h-4" />}
                    pathname={pathname}
                  >
                    Bài viết của tôi
                  </NavLink>
                </div>
              </>
            )}

            <Separator className="my-3" />

            {/* Security Section */}
            <div className="py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
                Bảo mật
              </p>
              
              <NavLink 
                href="/User/ChangePassword" 
                icon={<Lock className="w-4 h-4" />}
                pathname={pathname}
              >
                Đổi mật khẩu
              </NavLink>
            </div>
          </nav>

          {/* User Stats */}
          <div className="mt-auto pt-4 border-t border-gray-200 space-y-3">
            {/* Member since */}
            <div className="text-center text-xs text-gray-500">
              <p>Thành viên từ {new Date().getFullYear()}</p>
            </div>
            
            {/* Back to Home */}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// Helper component for navigation links
function NavLink({ 
  href, 
  children, 
  icon, 
  pathname 
}: { 
  href: string; 
  children: ReactNode; 
  icon: ReactNode; 
  pathname: string; 
}) {
  const active = pathname === href || pathname.startsWith(href);
  
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors gap-3 w-full
      ${active 
        ? "bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500" 
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className={`${active ? 'text-emerald-600' : 'text-gray-500'}`}>
        {icon}
      </span>
      {children}
    </Link>
  );
}