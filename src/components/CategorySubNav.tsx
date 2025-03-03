// src/components/CategorySubNav.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "./ui/scroll-area";
import Image from "next/image";

// import { ScrollArea } from "@/components/ui/scroll-area"; // Nếu muốn dùng shadcn scroll

interface ChildrenCategory {
  childrenCategoryID: number;
  childrenCategoryName: string;
  parentCategoryId: number;
  description: string;
}

interface CategorySubNavProps {
  parentId: number;
}

export function CategorySubNav({ parentId }: CategorySubNavProps) {
  const [childrenCategories, setChildrenCategories] = useState<ChildrenCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    
    const element = document.getElementById(targetId);
    if (element) {
      // Cuộn đến phần tử mục tiêu một cách mượt mà
      element.scrollIntoView({ behavior: "smooth" });
      
      // Cập nhật URL với hash mà không làm trang reload
      window.history.pushState(null, "", `#${targetId}`);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 500); // Đợi DOM load hoàn tất
    }
  }, []);

  useEffect(() => {
    if (!parentId) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/ChildrenCategory/GetChildrenCategoriesByParenID?ParentID=${parentId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.statusCode === 1) {
          setChildrenCategories(json.data);
        } else {
          setError(json.message || "Lỗi khi tải danh mục con");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [parentId]);

  if (loading) {
    return <div className="p-4">Đang tải danh mục con...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  if (!childrenCategories.length) {
    // Không có danh mục con, bạn có thể return null hoặc 1 thông báo
    return null;
  }

  return (
    <div className="w-full">
    {/* Banner section with parentName overlay */}
    <div className="relative w-full h-64">
      <Image 
        src="/placeholder/400/anhto.png" // Cần thay đổi đường dẫn này tới ảnh của bạn
        alt={"Crypto Knowledge Banner"}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-4xl font-bold text-center">
          {"Learn - Thư viện kiến thức Crypto"}
        </h1>
        <p className="mt-4 text-center max-w-3xl">
          Lộ trình kiến thức Crypto cần trang bị trước khi bước vào thị trường: Blockchain, tiền mã hóa và kinh nghiệm đầu tư Crypto.
        </p>
      </div>
      
      {/* Search bar */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center">
        <div className="relative w-full max-w-xl mx-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search in portal" 
            className="pl-10 pr-4 py-2 w-full rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>
    </div>

    {/* Categories navigation */}
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <ScrollArea className="w-full">
          <div className="flex items-center justify-center gap-6">
            {childrenCategories.map((child) => (
              <Link
                key={child.childrenCategoryID}
                href={`#child-${child.childrenCategoryID}`}
                className="text-gray-600 hover:text-gray-900 whitespace-nowrap px-2 py-1"
                onClick={(e) => handleNavClick(e, `child-${child.childrenCategoryID}`)}
              >
                {child.childrenCategoryName}
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </nav>
  </div>
  );
}
