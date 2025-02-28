"use client"; // lưu ý cần khai báo use client nếu đang dùng App Router (Next.js 13+)

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // import hook này
import { 
  Pencil, 
  LayoutGrid,
  User,
  Bookmark,
  Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";


export default function ProfileLayout({ children }: { children: ReactNode }) {
  const user = useAuth();
  const fullName = user.user?.fullname;
  
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 ml-24">
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="space-y-4 px-3">
            <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center text-2xl font-semibold text-yellow-800">
              LV
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <p className="text-sm text-gray-500">Add your short bio</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavLink href="/profle/contributor" icon={<LayoutGrid className="w-4 h-4" />}>
              Contribution
            </NavLink>
            <NavLink href="/profle/about" icon={<User className="w-4 h-4" />}>
              About
            </NavLink>
            <NavLink href="/profle/saved" icon={<Bookmark className="w-4 h-4" />}>
              Saved
            </NavLink>
            <NavLink href="/profle/settings" icon={<Settings className="w-4 h-4" />}>
              Settings
            </NavLink>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl ml-3 mr-auto p-5">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 mb-6">
            <Link
              href="/profile/edit"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit profile
            </Link>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </main>
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
  // Kiểm tra xem pathname có khớp với href (hoặc startsWith để khớp cả các route con)
  const active = pathname === href || pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center pl-6 pr-3 py-2 text-sm rounded-lg transition-colors gap-3 ${
        active 
          ? "bg-yellow-50 text-yellow-800 font-medium" 
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
