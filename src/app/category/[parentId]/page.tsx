"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NewsCard } from "@/components/sections/news/NewsCard";
import { ScrollableSection } from "@/components/sections/news/ScrollableSection";
import { CategorySubNav } from "@/components/CategorySubNav";

export default function ParentCategoryPage() {
  const params = useParams();
  const parentId = params.parentId; // Lấy parentId từ route
  const [childrenCategories, setChildrenCategories] = useState<any[]>([]);
  const [newsByChildId, setNewsByChildId] = useState<{ [key: number]: any[] }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 1000); // Đợi DOM và dữ liệu load hoàn tất
    }
  }, [childrenCategories]);

  // Lấy danh sách children category
  useEffect(() => {
    if (!parentId) return;
    setLoading(true);
    fetch(
      `http://localhost:5000/api/ChildrenCategory/GetChildrenCategoriesByParenID?ParentID=${parentId}`
    )
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

  // Lấy tin bài cho mỗi children category
  useEffect(() => {
    childrenCategories.forEach((child) => {
      fetch(
        `http://localhost:5000/api/News/GetNewsByChildrenCategoryId?categoryID=${child.childrenCategoryID}`
      )
        .then((res) => res.json())
        .then((json) => {
          if (json.statusCode === 1) {
            setNewsByChildId((prev) => ({
              ...prev,
              [child.childrenCategoryID]: json.data,
            }));
          }
        })
        .catch((err) => console.error("Lỗi fetch tin cho child: ", err));
    });
  }, [childrenCategories]);

  if (loading) {
    return <div className="p-4">Đang tải danh mục con...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <>
      {/* Sub-header hiển thị danh sách children category */}
      <CategorySubNav parentId={Number(parentId)} />

      {/* Nội dung hiển thị bài viết cho từng children category */}
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {childrenCategories.map((child) => {
          const childNews = newsByChildId[child.childrenCategoryID] || [];
          return (
            <ScrollableSection
              key={child.childrenCategoryID}
              title={child.childrenCategoryName}
              id={`child-${child.childrenCategoryID}`} // Để nhảy đến section
            >
              {childNews.map((item: any) => (
                <NewsCard key={item.newsID} item={item} />
              ))}
            </ScrollableSection>
          );
        })}
      </div>
    </>
  );
}
