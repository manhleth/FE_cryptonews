"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Pencil, BookOpen, Calendar, User, FileText, Info, Plus, Loader2, Bold, Italic, List, Hash, Quote, Minus, Star, ArrowRight, Type, Eye, Edit3 } from "lucide-react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Các state để lưu dữ liệu form
  const [head, setHead] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [timeReading, setTimeReading] = useState("");
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

  // Preview state
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Formatting functions cho editor
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = content;
    
    const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const wrapSelectedText = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const currentText = content;
    
    if (selectedText) {
      const newText = currentText.substring(0, start) + before + selectedText + after + currentText.substring(end);
      setContent(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, end + before.length);
      }, 0);
    } else {
      insertTextAtCursor(before + after);
    }
  };

  // Formatting options
  const formatOptions = [
    {
      label: "Tiêu đề lớn",
      icon: Hash,
      action: () => insertTextAtCursor("\n\n# "),
      description: "Tạo tiêu đề chính"
    },
    {
      label: "Tiêu đề phụ",
      icon: Hash,
      action: () => insertTextAtCursor("\n\n## "),
      description: "Tạo tiêu đề phụ"
    },
    {
      label: "Đậm",
      icon: Bold,
      action: () => wrapSelectedText("**"),
      description: "Làm đậm text"
    },
    {
      label: "Nghiêng",
      icon: Italic,
      action: () => wrapSelectedText("*"),
      description: "Làm nghiêng text"
    },
    {
      label: "Trích dẫn",
      icon: Quote,
      action: () => insertTextAtCursor("\n\n> "),
      description: "Thêm trích dẫn"
    },
    {
      label: "Danh sách",
      icon: List,
      action: () => insertTextAtCursor("\n\n• "),
      description: "Tạo danh sách có dấu đầu dòng"
    }
  ];

  // Special characters
  const specialChars = [
    { char: "—", name: "Gạch ngang dài" },
    { char: "–", name: "Gạch ngang ngắn" },
    { char: "•", name: "Dấu đầu dòng" },
    { char: "→", name: "Mũi tên phải" },
    { char: "←", name: "Mũi tên trái" },
    { char: "★", name: "Ngôi sao đặc" },
    { char: "☆", name: "Ngôi sao rỗng" },
    { char: "✓", name: "Dấu check" },
    { char: "✗", name: "Dấu X" },
    { char: "⚡", name: "Tia chớp" },
    { char: "🔥", name: "Lửa" },
    { char: "💡", name: "Bóng đèn" },
    { char: "📌", name: "Ghim" },
    { char: "⭐", name: "Ngôi sao" },
    { char: "🎯", name: "Mục tiêu" }
  ];

  // Quick templates
  const templates = [
    {
      name: "Phân cách đơn giản",
      content: "\n\n— — — — —\n\n"
    },
    {
      name: "Phân cách với sao",
      content: "\n\n★ ★ ★ ★ ★\n\n"
    },
    {
      name: "Gạch ngang dài",
      content: "\n\n———————————————————————————————————————\n\n"
    },
    {
      name: "Khung thông tin",
      content: "\n\n📌 **THÔNG TIN QUAN TRỌNG:**\n\n• \n• \n• \n\n"
    },
    {
      name: "Kết luận",
      content: "\n\n🎯 **KẾT LUẬN:**\n\n"
    }
  ];

  // Format content for preview
  const formatContentForPreview = (text: string) => {
    if (!text) return "";
    
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mb-4 text-gray-900">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mb-3 text-gray-800">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-medium mb-2 text-gray-700">{line.substring(4)}</h3>;
      }
      
      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-emerald-400 pl-4 py-2 my-3 bg-emerald-50 italic text-gray-700">
            {line.substring(2)}
          </blockquote>
        );
      }
      
      // Lists
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={index} className="ml-4 mb-1 text-gray-700">
            {line.substring(2)}
          </li>
        );
      }
      
      // Bold and italic text
      let processedLine = line;
      
      // Bold **text**
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      
      // Italic *text*
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
      
      // Empty lines
      if (line.trim() === '') {
        return <br key={index} className="my-2" />;
      }
      
      // Regular paragraphs
      return (
        <p 
          key={index} 
          className="mb-3 text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });
  };

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
    setSelectedCategory("");
    setSelectedChilrenCategory("");
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    setIsPreviewMode(false);
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!head.trim() || !title.trim() || !content.trim() || !timeReading || !selectedCategory || !selectedChildrenCategory) {
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
    formData.append("footer", "");
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
          <DialogContent className="sm:max-w-7xl max-h-[95vh] overflow-hidden p-0">
            <ScrollArea className="max-h-[calc(95vh-4rem)]">
              <div className="p-6">
                <DialogHeader className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl font-bold text-emerald-600 flex items-center">
                        <Pencil className="w-5 h-5 mr-2" />
                        Đăng bài viết mới
                      </DialogTitle>
                      <DialogDescription>
                        Sử dụng các công cụ formatting để tạo bài viết đẹp mắt với ký tự đặc biệt và định dạng.
                      </DialogDescription>
                    </div>
                    
                    {/* Toggle Preview/Edit */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={!isPreviewMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsPreviewMode(false)}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Chỉnh sửa
                      </Button>
                      <Button
                        type="button"
                        variant={isPreviewMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsPreviewMode(true)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Xem trước
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                
                {/* Form và Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Section */}
                  <div className={`${isPreviewMode ? 'hidden lg:block' : ''}`}>
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
                        
                        {/* Nội dung bài viết với editor nâng cao */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Nội dung <span className="text-red-500">*</span>
                          </label>
                          
                          {/* Toolbar */}
                          <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-3">
                            {/* Format options */}
                            <div className="mb-3">
                              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                                <Type className="w-3 h-3 mr-1" />
                                Định dạng
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {formatOptions.map((option, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={option.action}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                                    title={option.description}
                                  >
                                    <option.icon className="w-3 h-3" />
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Special characters */}
                            <div className="mb-3">
                              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                                <Star className="w-3 h-3 mr-1" />
                                Ký tự đặc biệt
                              </h4>
                              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                {specialChars.map((char, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => insertTextAtCursor(char.char)}
                                    className="px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                                    title={char.name}
                                  >
                                    {char.char}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Quick templates */}
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                                <ArrowRight className="w-3 h-3 mr-1" />
                                Mẫu có sẵn
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {templates.map((template, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => insertTextAtCursor(template.content)}
                                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                                  >
                                    {template.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Text area */}
                          <textarea
                            ref={textareaRef}
                            id="content"
                            name="content"
                            rows={12}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 rounded-b-lg border border-gray-300 border-t-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-sm"
                            placeholder="Nhập nội dung bài viết... 

Bạn có thể sử dụng:
# Tiêu đề lớn
## Tiêu đề nhỏ
**Text đậm**
*Text nghiêng*
> Trích dẫn
• Danh sách
— Gạch ngang
★ Ký tự đặc biệt"
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

                  {/* Preview Section */}
                  <div className={`${!isPreviewMode ? 'hidden lg:block' : ''} bg-white border border-gray-200 rounded-lg p-6`}>
                    <div className="sticky top-0">
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Eye className="w-5 h-5 text-emerald-600" />
                          Xem trước bài viết
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Đây là cách bài viết sẽ hiển thị cho người đọc
                        </p>
                      </div>

                      {/* Preview Content */}
                      <div className="space-y-6">
                        {/* Header Image Preview */}
                        {imagePreview && (
                          <div className="aspect-video relative overflow-hidden rounded-lg">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          </div>
                        )}

                        {/* Article Header */}
                        <header className="space-y-4">
                          {head && (
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                              {head}
                            </h1>
                          )}

                          {/* Author Info Preview */}
                          <div className="flex items-center gap-4">
                            <img 
                              src={user?.avatar || "/placeholder/48/48.jpg"} 
                              alt={user?.fullname} 
                              className="w-12 h-12 rounded-full border-2 border-white shadow-md" 
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{user?.fullname || user?.username}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  <span>{timeReading || "0"} phút đọc</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Hôm nay</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Title/Description */}
                          {title && (
                            <div className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                              <p className="text-emerald-800 font-medium">{title}</p>
                            </div>
                          )}
                        </header>

                        {/* Content Preview */}
                        <div className="prose prose-lg max-w-none">
                          <div className="text-gray-700 leading-relaxed">
                            {content ? (
                              <div className="space-y-4">
                                {formatContentForPreview(content)}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Nội dung bài viết sẽ hiển thị ở đây...</p>
                                <p className="text-sm mt-1">Nhập nội dung bên trái để xem preview</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category Preview */}
                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-500">Danh mục:</span>
                          {selectedCategory && (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                              {categories.find(cat => cat.categoryId.toString() === selectedCategory)?.categoryName || "Đang chọn..."}
                            </Badge>
                          )}
                          {selectedChildrenCategory && (
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                              {childrenCategories.find(cat => cat.childrenCategoryID.toString() === selectedChildrenCategory)?.childrenCategoryName || "Đang chọn..."}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hiển thị bài viết - GIỮ NGUYÊN CODE GỐC */}
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
                            {user?.fullname?.charAt(0) || "U"}
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