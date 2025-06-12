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
  Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bio, setBio] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - User Profile & Navigation */}
      <div className="w-[260px] border-r border-gray-200 bg-white flex-shrink-0">
        <div className="sticky top-0 p-4 flex flex-col h-screen">
          {/* User Profile Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="w-20 h-20 mb-4">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={user.fullname} />
              ) : (
                <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xl">
                  {user?.fullname?.slice(0, 2).toUpperCase() || "LV"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{user?.fullname || "Le Duc Manh"}</h2>
              <p className="text-sm text-gray-500 mt-1">{bio}</p>
            </div>
          </div>

          <Separator className="my-4" />
          
          {/* Navigation Menu */}
          <nav className="space-y-1 flex-1">
            {/* Thông tin cá nhân */}
            <NavLink 
              href="/profle/edit" 
              icon={<Pencil className="w-4 h-4" />}
              pathname={pathname}
            >
              Chỉnh sửa thông tin
            </NavLink>

            {/* Bài viết của tôi */}
            <NavLink 
              href="/profle/contributor" 
              icon={<FileText className="w-4 h-4" />}
              pathname={pathname}
            >
              Bài viết của tôi
            </NavLink>

            {/* Đã lưu */}
            <NavLink 
              href="/profle/saved" 
              icon={<Bookmark className="w-4 h-4" />}
              pathname={pathname}
            >
              Đã lưu
            </NavLink>

            <Separator className="my-3" />

            {/* Bảo mật Section */}
            <div className="py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">
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

          {/* Bottom Navigation */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-8">
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
      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors gap-2 
      ${active ? "bg-emerald-50 text-emerald-600 font-medium" : "text-gray-700 hover:bg-gray-100"}`}
    >
      {icon}
      {children}
    </Link>
  );
}