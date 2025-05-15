"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Category {
  categoryId: number;
  categoryName: string;
  description: string | null;
  createdDate: string | null;
  modifiedDate: string | null;
}

interface ChildrenCategory {
  childrenCategoryName: string;
  parentCategoryId: number;
  childrenCategoryID: number;
}


interface Post {
  newsID: number;
  header: string;
  title: string;
  timeReading: string;
  createdDate: string;
  imagesLink: string | null;
}

export default function ContributorPage() {
  const user = useAuth();
  const userId = user.user?.userId;
  const tokenSend = user.token;

  // Các state để lưu dữ liệu form
  const [head, setHead] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [timeReading, setTimeReading] = useState("");
  const [footer, setFooter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedChildrenCategory, setSelectedChilrenCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [childrenCategories, setChildrenCategories] = useState<ChildrenCategory[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  // Lấy danh mục từ API khi component mount
  useEffect(() => {
    fetch("http://localhost:5000/api/Category/GetAllCategories")
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 1 && data.data) {
          setCategories(data.data);
        }
      })
      .catch((error) => console.error("Error fetching categories:", error));
  }, []);
  useEffect(() => {
    if (selectedCategory) {
      fetch(`http://localhost:5000/api/ChildrenCategory/GetChildrenCategoriesByParenID?ParentID=${selectedCategory}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenSend}`,
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.statusCode === 1 && data.data) {
            console.log(data.data);
            setChildrenCategories(data.data);
          }
        })
    }
  }, [selectedCategory])
  useEffect(() => {
    if (!userId) return; // Chưa có userId thì không fetch
    fetch(`http://localhost:5000/api/News/GetYourPost?userid=${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenSend}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 1 && data.data) {
          setMyPosts(data.data);
        }
      })
      .catch((error) => console.error("Error fetching your posts:", error));
  }, [userId, tokenSend]);

  // Xử lý thay đổi file ảnh và tạo preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      const imageUrlString = `/placeholder/400/${file.name}`;
      setImageUrl(imageUrlString);
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();


    let finalImagePath = imageUrl; // Nếu không có file mới, dùng giá trị ban đầu
    // Nếu có file ảnh, tiến hành upload file
    if (imageFile) {
      const imageFormData = new FormData();
      imageFormData.append("image", imageFile);
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadRes.ok) {
          finalImagePath = uploadResult.filePath;
        } else {
          console.error("Image upload failed:", uploadResult.error);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
    // Tạo formData cho bài viết mới, bao gồm đường dẫn ảnh (imageUrl)
    console.log("Đường dẫn ảnh gửi đi: " + finalImagePath);
    const formData = new FormData();
    formData.append("header", head);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("timeReading", timeReading);
    formData.append("footer", footer);
    formData.append("categoryId", selectedCategory);
    formData.append("userId", userId!.toString());
    formData.append("childrenCategoryId", selectedChildrenCategory);
    // Gửi chuỗi đường dẫn ảnh thay vì file thực tế
    formData.append("imagesLink", finalImagePath);

    try {
      const res = await fetch("http://localhost:5000/api/News/CreateNewPost", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenSend}`,
          // Không cần set Content-Type khi dùng FormData
        },
        body: formData,
      });
      const result = await res.json();
      if (result && result.statusCode === 1) {
        // Reset form
        setHead("");
        setTitle("");
        setContent("");
        setTimeReading("");
        setFooter("");
        setSelectedCategory("");
        setImageFile(null);
        setImagePreview(null);
        setImageUrl("");
        fetch(`http://localhost:5000/api/News/GetYourPost?userid=${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenSend}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 1 && data.data) {
              setMyPosts(data.data);
            }
          })
          .catch((error) => console.error("Error fetching your posts:", error));

      }
      console.log("Create post result:", result);

      // Xử lý sau khi tạo bài viết thành công: thông báo, reset form, đóng dialog, v.v.
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };


  return (
    <div>
      {/* Phần header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Posts</h1>

        {/* Nút mở form tạo bài viết mới */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="px-6 py-2 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 transition-colors">
              Create new post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo bài viết mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin bài viết bên dưới.
              </DialogDescription>
            </DialogHeader>
            {/* Form thêm bài viết */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="head"
                >
                  Head
                </label>
                <input
                  type="text"
                  id="head"
                  name="head"
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
                  className="border border-gray-300 rounded w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-700"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="title"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border border-gray-300 rounded w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-700"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="content"
                >
                  Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="border border-gray-300 rounded w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-700"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="timeReading"
                >
                  Time reading
                </label>
                <input
                  type="number"
                  id="timeReading"
                  name="timeReading"
                  value={timeReading}
                  onChange={(e) => setTimeReading(e.target.value)}
                  className="border border-gray-300 rounded w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-700"
                />
              </div>
              {/* Dropdown chọn danh mục */}
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="category"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-700"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>

              </div>
              {/* Dropdown chọn danh mục con*/}
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="category"
                >
                  Children Category
                </label>
                <select
                  id="childrenCategory"
                  name="childrenCategory"
                  value={selectedChildrenCategory}
                  onChange={(e) => setSelectedChilrenCategory(e.target.value)}
                  className="border border-gray-300 rounded w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-700"
                >
                  <option value="">Select a children category</option>
                  {childrenCategories.map((cat) => (
                    <option key={cat.childrenCategoryID} value={cat.childrenCategoryID}>
                      {cat.childrenCategoryName}
                    </option>
                  ))}
                </select>
              </div>
              {/* Ô chọn ảnh */}
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="image"
                >
                  Image
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="border border-gray-300 rounded w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-700"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="footer"
                >
                  Footer
                </label>
                <input
                  type="text"
                  id="footer"
                  name="footer"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  className="border border-gray-300 rounded w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-700"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
                <Button type="submit" className="bg-yellow-700 hover:bg-yellow-800">
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Nội dung chính trang Contributor */}
      {myPosts.length === 0 ? (
        <p className="text-gray-500">No contributions yet.</p>
      ) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myPosts.map((post) => (
          <Link href={`/news/${post.newsID}`} key={post.newsID}>
            <div

              className="border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="w-full h-40 overflow-hidden rounded mb-3">
                <img
                  src={post.imagesLink || "/placeholder/400/1.jpg"}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Thông tin tác giả, ngày tạo, v.v. */}
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <span className="font-semibold mr-2">
                  {user.user?.fullname || "You"}
                </span>
                <span className="text-xs">
                  •{" "}
                  {new Date(post.createdDate).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {/* Tiêu đề, header, v.v. */}
              <h2 className="text-lg font-bold mb-1">{post.title.slice(0, 50) + "..."}</h2>
              <p className="text-sm text-gray-700 line-clamp-2">
                {post.header.slice(0, 50) + "..."}
              </p>
              <div className="flex items-center mt-2 text-gray-500 text-xs">
                <span>{post.timeReading} min read</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      )}
    </div>
  );
}
