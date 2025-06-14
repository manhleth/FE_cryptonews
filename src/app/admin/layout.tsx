// Update src/app/admin/layout.tsx - Add Analytics menu item
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  FileText, 
  FolderTree, 
  MessageCircle, 
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  BarChart3 // Add this import
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Check if admin token exists on mount
  useEffect(() => {
    const adminToken = localStorage.getItem("tokenAdmin");
    if (!adminToken) {
      router.push("/admin/login");
    }
  }, [router]);

  const menuItems = [
    {
      href: "/admin/accounts",
      icon: Users,
      label: "Bảo trì tài khoản"
    },
    {
      href: "/admin/news",
      icon: FileText,
      label: "Bảo trì tin tức"
    },
    {
      href: "/admin/category",
      icon: FolderTree,
      label: "Bảo trì danh mục"
    },
    {
      href: "/admin/comments",
      icon: MessageCircle,
      label: "Quản lý bình luận"
    },
    {
      href: "/admin/analytics", // Add analytics menu item
      icon: BarChart3,
      label: "Thống kê & Phân tích"
    }
  ];

  const handleAdminLogout = () => {
    localStorage.removeItem("tokenAdmin");
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-lg
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href} 
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-200 group"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 group-hover:text-emerald-600" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <button 
              onClick={handleAdminLogout}
              className="w-full flex items-center justify-center space-x-2 text-red-600 py-2 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Đăng xuất</span>
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Admin Dashboard v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Admin Panel</h1>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}