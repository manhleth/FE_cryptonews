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
import { useToast } from "@/hooks/use-toast";
import { Pencil, BookOpen, Calendar, User, FileText, Info, Plus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  const { user, token } = useAuth();
  const userId = user?.userId;
  const tokenSend = token;
  const { toast } = useToast();

  // Các state để lưu dữ liệu form
  const [head, setHead] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [timeReading, setTimeReading] = useState("");
  const [footer, setFooter] = useState(""); // Đảm bảo có state footer
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedChildrenCategory, setSelectedChilrenCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [childrenCategories, setChildrenCategories] = useState<ChildrenCategory[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Lấy danh mục từ API khi component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Lấy danh mục con khi danh mục cha thay đổi
  useEffect(() => {
    if (selectedCategory) {
      fetchChildrenCategories(selectedCategory);
    }
  }, [selectedCategory]);

  // Lấy bài viết của người dùng
  useEffect(() => {
    if (!userId) return;
    fetchUserPosts();
  }, [userId, tokenSend]);

  // Fetch danh mục cha
  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Category/GetAllCategories");
      const data = await response.json();
      if (data.statusCode === 1 && data.data) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
    }
  };

  // Fetch danh mục con
  const fetchChildrenCategories = async (parentId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/ChildrenCategory/GetChildrenCategoriesByParenID?ParentID=${parentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenSend}`,
        }
      });
      const data = await response.json();
      if (data.statusCode === 1 && data.data) {
        setChildrenCategories(data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh mục con:", error);
    }
  };

  // Fetch bài viết của người dùng
  const fetchUserPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch(`http://localhost:5000/api/News/GetYourPost?userid=${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenSend}`,
        },
      });
      const data = await response.json();
      if (data.statusCode === 1 && data.data) {
        setMyPosts(data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy bài viết của bạn:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

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

  // Reset form
  const resetForm = () => {
    setHead("");
    setTitle("");
    setContent("");
    setTimeReading("");
    setFooter(""); // Reset footer
    setSelectedCategory("");
    setSelectedChilrenCategory("");
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form - Thêm kiểm tra footer
    if (!head.trim() || !title.trim() || !content.trim() || !timeReading || !footer.trim() || !selectedCategory || !selectedChildrenCategory) {
      toast({
        title: "Vui lòng điền đầy đủ thông tin",
        description: "Hãy kiểm tra lại các trường bắt buộc",
        variant: "destructive",
        duration: 3000
      });
      setIsSubmitting(false);
      return;
    }

    let finalImagePath = imageUrl;
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
          toast({
            title: "Lỗi tải ảnh",
            description: "Không thể tải ảnh lên, vui lòng thử lại",
            variant: "destructive",
            duration: 3000
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Lỗi khi tải ảnh lên:", error);
        toast({
          title: "Lỗi tải ảnh",
          description: "Đã xảy ra lỗi khi tải ảnh lên",
          variant: "destructive",
          duration: 3000
        });
        setIsSubmitting(false);
        return;
      }
    }

    // Tạo formData cho bài viết mới
    const formData = new FormData();
    formData.append("header", head);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("timeReading", timeReading);
    formData.append("footer", footer); // Đảm bảo footer được thêm vào
    formData.append("categoryId", selectedCategory);
    formData.append("userId", userId!.toString());
    formData.append("childrenCategoryId", selectedChildrenCategory);
    formData.append("imagesLink", finalImagePath);

    try {
      const res = await fetch("http://localhost:5000/api/News/CreateNewPost", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenSend}`,
        },
        body: formData,
      });
      
      const result = await res.json();
      if (result && result.statusCode === 1) {
        // Reset form và đóng dialog
        resetForm();
        setIsOpen(false);
        
        // Hiển thị thông báo thành công
        toast({
          title: "Đăng bài viết thành công",
          description: "Đăng bài viết thành công",
          duration: 3000
        });
        
        // Cập nhật danh sách bài viết
        fetchUserPosts();
      } else {
        // Hiển thị thông báo lỗi
        toast({
          title: "Lỗi đăng bài viết",
          description: result.message || "Đã xảy ra lỗi khi đăng bài viết",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Lỗi khi đăng bài viết:", error);
      toast({
        title: "Lỗi đăng bài viết",
        description: "Đã xảy ra lỗi khi gửi bài viết",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div>
      {/* Header và nút tạo bài viết */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bài Viết Của Tôi</h1>
          <p className="text-gray-500 mt-1">Quản lý và tạo nội dung mới</p>
        </div>

        {/* Nút tạo bài viết mới */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Đăng bài viết mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden p-0">
            <ScrollArea className="max-h-[calc(90vh-4rem)]">
              <div className="p-6">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-bold text-emerald-600 flex items-center">
                    <Pencil className="w-5 h-5 mr-2" />
                    Đăng bài viết mới
                  </DialogTitle>
                  <DialogDescription>
                    Điền đầy đủ thông tin để Đăng bài viết mới. Các trường có dấu * là bắt buộc.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Form thêm bài viết */}
                <form onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    {/* Tiêu đề bài viết */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="head">
                        Tiêu đề bài viết <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="head"
                        name="head"
                        value={head}
                        onChange={(e) => setHead(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="Nhập tiêu đề bài viết"
                      />
                    </div>
                    
                    {/* Mô tả ngắn */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="title">
                        Mô tả ngắn <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="Nhập mô tả ngắn"
                      />
                    </div>
                    
                    {/* Nội dung bài viết */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="content">
                        Nội dung <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="content"
                        name="content"
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="Nhập nội dung bài viết"
                      />
                    </div>
                    
                    {/* Thời gian đọc */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="timeReading">
                        Thời gian đọc (phút) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="timeReading"
                        name="timeReading"
                        min="1"
                        value={timeReading}
                        onChange={(e) => setTimeReading(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="Nhập thời gian đọc"
                      />
                    </div>

                    {/* Footer/Kết luận */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="footer">
                        Kết luận <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="footer"
                        name="footer"
                        rows={3}
                        value={footer}
                        onChange={(e) => setFooter(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        placeholder="Nhập kết luận cho bài viết"
                      />
                    </div>
                    
                    {/* Danh mục */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="category">
                          Danh mục <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((cat) => (
                            <option key={cat.categoryId} value={cat.categoryId}>
                              {cat.categoryName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Danh mục con */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="childrenCategory">
                          Danh mục con <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="childrenCategory"
                          name="childrenCategory"
                          value={selectedChildrenCategory}
                          onChange={(e) => setSelectedChilrenCategory(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          disabled={!selectedCategory}
                        >
                          <option value="">Chọn danh mục con</option>
                          {childrenCategories.map((cat) => (
                            <option key={cat.childrenCategoryID} value={cat.childrenCategoryID}>
                              {cat.childrenCategoryName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Ảnh đại diện */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="image">
                        Ảnh bìa <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-500 transition-all">
                        <input
                          type="file"
                          id="image"
                          name="image"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label htmlFor="image" className="cursor-pointer block">
                          {imagePreview ? (
                            <div className="space-y-3">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-h-40 mx-auto object-cover rounded-lg"
                              />
                              <p className="text-sm text-emerald-600">Nhấp để thay đổi ảnh</p>
                            </div>
                          ) : (
                            <div className="py-4">
                              <Plus className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500">Nhấp để tải ảnh lên</p>
                              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (tối đa 2MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 mt-8">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Hủy
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Pencil className="w-4 h-4 mr-2" />
                          Tạo bài viết
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hiển thị bài viết */}
      {loadingPosts ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Đang tải bài viết...</span>
        </div>
      ) : myPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-xl p-8">
          <div className="w-20 h-20 mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-emerald-500/40" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có bài viết nào</h3>
          <p className="text-gray-600 mb-6 max-w-md">Hãy bắt đầu chia sẻ kiến thức của bạn bằng cách đăng bài viết đầu tiên</p>
          <Button 
            onClick={() => setIsOpen(true)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Đăng bài viết đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-emerald-600" />
              Bài viết của tôi ({myPosts.length})
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPosts.map((post) => (
              <Link href={`/news/${post.newsID}`} key={post.newsID} className="group">
                <div className="border border-gray-200 hover:border-emerald-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
                  {/* Ảnh bài viết */}
                  <div className="w-full h-48 overflow-hidden relative">
                    <img
                      src={post.imagesLink || "/placeholder/400/250.jpg"}
                      alt={post.header}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-2 px-4">
                      <div className="flex items-center gap-1 text-white text-xs">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(post.createdDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Nội dung */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {post.header}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">{post.title}</p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto border-t border-gray-100 pt-3">
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          <span>{post.timeReading} phút đọc</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={user?.avatar || "/placeholder/24/24"} alt={user?.fullname} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {user?.fullname.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">Bạn</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}