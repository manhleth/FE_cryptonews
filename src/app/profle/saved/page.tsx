"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bookmark, Link, Pointer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SavedItem {
  newsID: number;
  header: string;
  title: string;
  links: string | null;        // đường dẫn ảnh (nếu có)
  timeReading: string;
  userName: string | null;
  userAvartar: string | null;
  timeAgo: string | null;
}

export default function SavedPage() {
  // State lưu danh sách "Posts" (categoryID=1) & tổng số
  const [posts, setPosts] = useState<SavedItem[]>([]);
  const [postsTotal, setPostsTotal] = useState<number>(0);
  // State lưu danh sách "Courses" (categoryID=2) & tổng số
  const [courses, setCourses] = useState<SavedItem[]>([]);
  const [coursesTotal, setCoursesTotal] = useState<number>(0);
  const token = useAuth();
  // State để biết tab hiện tại (posts | courses)
  // Mặc định "posts"
  const [activeTab, setActiveTab] = useState<"posts" | "courses">("posts");


  async function fetchSavedPosts() {
    try {
      const response = await fetch("http://localhost:5000/api/Saved/GetListSavedPostByUser?categoryID=1", {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const text = await response.text();
      if (text) {
        const data = JSON.parse(text);
        if (data.statusCode === 1 && data.data) {
          setPosts(data.data.listSaved);
          setPostsTotal(data.data.total);
        }
      } else {
        console.error("API trả về dữ liệu rỗng");
      }

    } catch (error) {
      console.error("Error fetching saved posts:", error);
    }
  }
  async function handleBookmark(newsID: number) {
    try {
      // Tuỳ vào phía backend yêu cầu GET hay POST, bạn sửa method tương ứng
      const response = await fetch(`http://localhost:5000/api/Saved/AddOrRemoveSaved?newsID=${newsID}`, {
        method: "POST", // Hoặc "POST" nếu backend yêu cầu
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error toggling saved item");
      }

      await fetchSavedPosts();
      await fetchSavedCourses();
    } catch (error) {
      console.error("Error toggling saved item:", error);
    }
    console.log("Bookmark clicked for news ID:", newsID);
  }


  // Gọi API lấy danh sách Saved Courses
  async function fetchSavedCourses() {
    try {
      const res = await fetch("http://localhost:5000/api/Saved/GetListSavedPostByUser?categoryID=2", {
        headers: {
          Authorization: `Bearer ${token.token}`
        }
      }).then((data) => data.json()).then((data) => {
        if (data.statusCode === 1 && data.data) {
          setCourses(data.data.listSaved);
          setCoursesTotal(data.data.total);
        }
      });
    } catch (error) {
      console.error("Error fetching saved courses:", error);
    }
  }

  // Lần đầu vào trang, fetch "Posts" mặc định
  useEffect(() => {
    if (token?.token) {
      fetchSavedPosts();
    }
  }, [token]);

  // Hàm xử lý khi đổi tab (dùng onValueChange của Tabs)
  function handleTabChange(value: string) {
    if (value === "posts") {
      setActiveTab("posts");
      // Nếu chưa load posts thì fetch
      // (Ở đây ta fetch lại cho chắc, hoặc có thể kiểm tra posts.length === 0)
      fetchSavedPosts();
    } else {
      setActiveTab("courses");
      // Tương tự, fetch courses
      fetchSavedCourses();
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Saved</h1>
        {/* Nút Newest (chỉ là ví dụ, bạn có thể thêm logic sắp xếp) */}
        <button className="text-sm text-gray-600 hover:text-gray-900">
          Newest
        </button>
      </div>

      {/* Số lượng posts/courses */}
      {activeTab === "posts" ? (
        <p className="text-sm text-gray-500 mb-2">{postsTotal} posts</p>
      ) : (
        <p className="text-sm text-gray-500 mb-2">{coursesTotal} courses</p>
      )}

      <Tabs
        defaultValue="posts"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent space-x-8">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none bg-transparent px-0 rounded-none text-base font-normal"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="courses"
              className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none bg-transparent px-0 rounded-none text-base font-normal text-gray-500"
            >
              Courses
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab "Posts" */}
        <TabsContent value="posts" className="mt-6">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 mb-4">
                <Bookmark className="w-full h-full text-yellow-700/20" strokeWidth={1} />
              </div>
              <p className="text-gray-500 mb-4">Your saved posts will appear here</p>
              <button className="px-6 py-2 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 transition-colors">
                Explore posts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((item) => (
                <div
                  key={item.newsID}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  {/* Ảnh đại diện bài viết (nếu có) */}
                  <div className="w-full h-40 overflow-hidden rounded mb-3">
                    <img
                      src={item.links || "/images/news/placeholder.jpg"}
                      alt={item.header}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Thông tin người đăng (nếu có) */}
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    {item.userAvartar ? (
                      <img
                        src={item.userAvartar}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full mr-2" />
                    )}
                    <span>{item.userName || "Unknown"}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span>{item.timeAgo || "some time ago"}</span>
                  </div>
                  {/* Tiêu đề */}
                  <h2 className="text-base font-semibold mb-1 line-clamp-2">
                    {item.header}
                  </h2>
                  {/* Mô tả ngắn (title) */}
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {item.title}
                  </p>
                  {/* Thời gian đọc */}
                  <div className="flex items-center mt-2 justify-between">
                    {/* "Pill" thời gian đọc */}
                    <span className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-600">
                      {item.timeReading} min read
                    </span>

                    {/* Các icon */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleBookmark(item.newsID)}
                        className="cursor-pointer p-1"
                        aria-label="Bookmark"
                      >
                        <Bookmark className="w-4 h-4 text-black fill-current" />
                      </button>
                      <Link className="w-4 h-4 text-gray-600" />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab "Courses" */}
        <TabsContent value="courses" className="mt-6">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 mb-4">
                <Bookmark className="w-full h-full text-yellow-700/20" strokeWidth={1} />
              </div>
              <p className="text-gray-500 mb-4">Your saved courses will appear here</p>
              <button className="px-6 py-2 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 transition-colors">
                Explore courses
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((item) => (
                <div
                  key={item.newsID}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  {/* Ảnh đại diện bài viết (nếu có) */}
                  <div className="w-full h-40 overflow-hidden rounded mb-3">
                    <img
                      src={item.links || "/images/news/placeholder.jpg"}
                      alt={item.header}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Thông tin người đăng (nếu có) */}
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    {item.userAvartar ? (
                      <img
                        src={item.userAvartar}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full mr-2" />
                    )}
                    <span>{item.userName || "Unknown"}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span>{item.timeAgo || "some time ago"}</span>
                  </div>
                  {/* Tiêu đề */}
                  <h2 className="text-base font-semibold mb-1 line-clamp-2">
                    {item.header}
                  </h2>
                  {/* Mô tả ngắn (title) */}
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {item.title}
                  </p>
                  {/* Thời gian đọc */}
                  <div className="flex items-center mt-2 justify-between">
                    {/* "Pill" thời gian đọc */}
                    <span className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-600">
                      {item.timeReading} min read
                    </span>

                    {/* Các icon */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleBookmark(item.newsID)}
                        className="cursor-pointer p-1"
                        aria-label="Bookmark"
                      >
                        <Bookmark className="w-4 h-4 text-black fill-current" />
                      </button>
                      <Link className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
