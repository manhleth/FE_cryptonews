// src/components/CategorySubNav.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "./ui/scroll-area";

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