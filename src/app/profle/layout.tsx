"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Pencil,
  FileText,
  Bookmark,
  ChevronLeft,
  User
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bio, setBio] = useState("Thêm tiểu sử ngắn của bạn");
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - User Profile & Navigation - Điều chỉnh kích thước */}
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
            <Link
              href="/profle/edit"
              className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors gap-2
              ${pathname.includes("/profle/edit") ? "bg-emerald-50 text-emerald-600 font-medium" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <Pencil className="w-4 h-4" />
              Chỉnh sửa thông tin
            </Link>
            <NavLink href="/profle/contributor" icon={<FileText className="w-4 h-4" />}>
              Bài viết của tôi
            </NavLink>
            <NavLink href="/profle/saved" icon={<Bookmark className="w-4 h-4" />}>
              Đã lưu
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Main Content Area - Điều chỉnh padding và max-width */}
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
  icon
}: {
  href: string;
  children: ReactNode;
  icon: ReactNode;
}) {
  const pathname = usePathname();
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