"use client";
import React, { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  Calendar,
  User,
  Clock,
  MoreVertical,
  AlertCircle,
  Check,
  TrendingUp,
  Edit,
  Save,
  X,
  Loader2,
  Star,
  StarOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type Article = {
  id: number;
  newsId: number;
  title: string;
  content: string;
  published: boolean;
  author?: string;
  createdAt?: string;
  views?: number;
  category?: string;
  excerpt?: string;
  image?: string;
  header?: string;
  footer?: string;
  timeReading?: number;
  links?: string;
  categoryId?: number;
  childrenCategoryId?: number;
  imagesLink?: string;
};

type FilterType = 'all' | 'published' | 'draft';

interface Category {
  categoryId: number;
  categoryName: string;
}

interface ChildrenCategory {
  childrenCategoryID: number;
  childrenCategoryName: string;
  parentCategoryId: number;
}

// Interface for edit form data
interface EditFormData {
  header: string;
  title: string;
  content: string;
  footer: string;
  timeReading: string;
  links: string;
  selectedCategory: string;
  selectedChildCategory: string;
  imageUrl: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [featuredNewsIds, setFeaturedNewsIds] = useState<number[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState<EditFormData>({
    header: "",
    title: "",
    content: "",
    footer: "",
    timeReading: "",
    links: "",
    selectedCategory: "",
    selectedChildCategory: "",
    imageUrl: ""
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [childCategories, setChildCategories] = useState<ChildrenCategory[]>([]);

  const { toast } = useToast();
  const { token } = useAuth();

  const valueToken = sessionStorage.getItem("token");

  useEffect(() => {
    fetchNews();
    console.log("tokenAdmin:", valueToken);
    fetchFeaturedNews();
  }, [valueToken]);

  useEffect(() => {
    let filtered = articles;

    if (filterType === 'published') {
      filtered = filtered.filter(a => a.published);
    } else if (filterType === 'draft') {
      filtered = filtered.filter(a => !a.published);
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  }, [articles, filterType, searchTerm]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    if (editFormData.selectedCategory && isEditModalOpen) {
      fetchChildCategories(editFormData.selectedCategory);
    } else {
      setChildCategories([]);
    }
  }, [editFormData.selectedCategory, isEditModalOpen]);

  useEffect(() => {
    if (isEditModalOpen && selectedNewsId) {
      fetchNewsDetails();
      fetchCategories();
    }
  }, [isEditModalOpen, selectedNewsId]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/News/GetAllNewAdmin", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách tin tức");
      }
      const result = await response.json();
      if (result.statusCode !== 1 || !result.data) {
        throw new Error("Lỗi dữ liệu từ API");
      }
      const mappedArticles: Article[] = result.data.map((item: any) => ({
        id: item.newsId,
        newsId: item.newsId,
        title: item.title || "",
        content: item.content || "",
        published: true,
        author: item.userName || item.author || "",
        createdAt: item.createdDate || "",
        views: Math.floor(Math.random() * 10000),
        category: item.categoryName || "",
        excerpt: item.header || "",
        image: item.imagesLink || "",
        header: item.header || "",
        footer: item.footer || "",
        timeReading: item.timeReading,
        links: item.links || "",
        categoryId: item.categoryId,
        childrenCategoryId: item.childrenCategoryId,
        imagesLink: item.imagesLink || ""
      }));
      setArticles(mappedArticles);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchFeaturedNews = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/News/GetFeaturedNews");
      if (response.ok) {
        const result = await response.json();
        if (result.statusCode === 1 && result.data) {
          const featuredIds = result.data.map((item: any) => item.newsId);
          setFeaturedNewsIds(featuredIds);
        }
      }
    } catch (error) {
      console.error("Error fetching featured news:", error);
    }
  };

  const fetchNewsDetails = async () => {
    if (!selectedNewsId) return;

    setEditLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/News/GetNewsByIdAsync?id=${selectedNewsId}`, {
        headers: {
          "Authorization": `Bearer ${valueToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.statusCode === 1 && result.data) {
        const newsData = result.data;

        // Update form data with fetched news details
        setEditFormData({
          header: newsData.header || "",
          title: newsData.title || "",
          content: newsData.content || "",
          footer: newsData.footer || "",
          timeReading: newsData.timeReading?.toString() || "",
          links: newsData.links || "",
          selectedCategory: newsData.categoryId?.toString() || "",
          selectedChildCategory: newsData.childrenCategoryId?.toString() || "",
          imageUrl: newsData.imagesLink || ""
        });

        setImagePreview(newsData.imagesLink || null);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin bài viết",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error fetching news details:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải thông tin bài viết",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setEditLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Category/GetAllCategories");
      const result = await response.json();

      if (result.statusCode === 1 && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchChildCategories = async (parentId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/ChildrenCategory/GetChildrenCategoriesByParenID?ParentID=${parentId}`, {
        headers: {
          "Authorization": `Bearer ${valueToken}`
        }
      }
      );

      const result = await response.json();

      if (result.statusCode === 1 && result.data) {
        setChildCategories(result.data);
      }
    } catch (error) {
      console.error("Error fetching child categories:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormDataChange = (field: keyof EditFormData, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEdit = (id: number) => {
    setSelectedNewsId(id);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedNewsId(null);
    setSubmitting(false);
    setEditFormData({
      header: "",
      title: "",
      content: "",
      footer: "",
      timeReading: "",
      links: "",
      selectedCategory: "",
      selectedChildCategory: "",
      imageUrl: ""
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const validateForm = (): boolean => {
    const { header, title, content, footer, timeReading, selectedCategory, selectedChildCategory } = editFormData;

    if (!header.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tiêu đề bài viết",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }

    if (!title.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mô tả ngắn",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }

    if (!content.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập nội dung bài viết",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }

    if (!footer.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập kết luận",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }

    if (!timeReading || parseInt(timeReading) <= 0) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập thời gian đọc hợp lệ",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }

    if (!selectedCategory) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn danh mục",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }

    if (!selectedChildCategory) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn danh mục con",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedNewsId) return;

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let finalImageUrl = editFormData.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        });

        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          if (uploadResult.success && uploadResult.filePath) {
            finalImageUrl = uploadResult.filePath;
          }
        } else {
          toast({
            title: "Cảnh báo",
            description: "Không thể tải ảnh lên, sử dụng ảnh hiện tại",
            duration: 3000
          });
        }
      }

      // Chuẩn bị form-data đúng tên trường backend
      const formData = new FormData();
      formData.append("NewsId", selectedNewsId!.toString());
      formData.append("Header", editFormData.header);
      formData.append("Title", editFormData.title);
      formData.append("Content", editFormData.content);
      formData.append("Footer", editFormData.footer);
      formData.append("TimeReading", editFormData.timeReading);
      formData.append("Links", editFormData.links || "");
      formData.append("CategoryId", editFormData.selectedCategory);
      formData.append("ChildrenCategoryId", editFormData.selectedChildCategory);
      formData.append("ImagesLink", finalImageUrl || "");

      // Nếu có các trường UserName, avatar, UserId, CreatedDate thì append nếu có dữ liệu
      // Ví dụ:
      // formData.append("UserName", userName);
      // formData.append("avatar", avatarUrl);
      // formData.append("UserId", userId.toString());
      // formData.append("CreatedDate", createdDateString);

      const response = await fetch(`http://localhost:5000/api/News/UpdateNews`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${valueToken}`
          // KHÔNG set Content-Type khi dùng FormData, browser sẽ tự set boundary
        },
        body: formData
      });

      console.log("Update response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update error response:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Update result:", result);

        if (result.statusCode === 1) {
           toast({
              title: "Thành công",
              description: "Cập nhật bài viết thành công",
               duration: 3000
            });
          handleCloseEditModal();

             fetchNews().catch(console.error);
        } else {
               throw new Error(result.message || "Lỗi không xác định");
        }
    } catch (error: any) {
      console.error("Error updating news:", error);
      toast({
        title: "Lỗi cập nhật",
        description: error.message || "Có lỗi xảy ra khi cập nhật bài viết",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/News/AdminDelele?id=${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi xóa bài viết");
      }
      setArticles(articles.filter((article) => article.id !== id));
      toast({
        title: "Thành công",
        description: "Bài viết đã được xóa",
        duration: 3000
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleToggleFeatured = async (newsId: number) => {
    const isFeatured = featuredNewsIds.includes(newsId);

    try {
      const response = await fetch(
        `http://localhost:5000/api/News/SetFeaturedNews?newsId=${newsId}&isFeatured=${!isFeatured}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${valueToken}`,
          },
        }
      );

      const result = await response.json();

      if (result.statusCode === 1) {
        toast({
          title: "Thành công",
          description: isFeatured ? "Đã bỏ chọn bài viết nổi bật" : "Đã chọn bài viết nổi bật",
          duration: 3000
        });

        if (isFeatured) {
          setFeaturedNewsIds(prev => prev.filter(id => id !== newsId));
        } else {
          setFeaturedNewsIds(prev => [...prev, newsId]);
        }
      } else {
        toast({
          title: "Lỗi",
          description: result.data || "Không thể cập nhật bài viết nổi bật",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleSelectChange = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedArticles((prev) => [...prev, id]);
    } else {
      setSelectedArticles((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredArticles.map((article) => article.id);
      setSelectedArticles(allIds);
    } else {
      setSelectedArticles([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.length === 0) {
      setError("Vui lòng chọn ít nhất một bài viết để xóa.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa những bài viết đã chọn?")) return;

    try {
      await Promise.all(
        selectedArticles.map((id) =>
          fetch(`http://localhost:5000/api/News/AdminDelele?id=${id}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${valueToken}`,
            },
          })
        )
      );
      fetchNews();
      setSuccess(`Đã xóa ${selectedArticles.length} bài viết thành công!`);
      setSelectedArticles([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const allSelected = filteredArticles.length > 0 && selectedArticles.length === filteredArticles.length;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (published: boolean) => {
    if (published) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <Check className="w-3 h-3 mr-1" />
          Đã xuất bản
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <Clock className="w-3 h-3 mr-1" />
          Bản nháp
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bảo trì tin tức</h1>
              <p className="text-gray-600">Quản lý và kiểm duyệt bài viết</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tổng số / Nổi bật</p>
            <p className="text-2xl font-bold text-emerald-600">
              {articles.length} / {featuredNewsIds.length}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-1 space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tất cả</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleBulkDelete}
              disabled={selectedArticles.length === 0}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa đã chọn ({selectedArticles.length})
            </button>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredArticles.map((article) => {
          const isFeatured = featuredNewsIds.includes(article.newsId);

          return (
            <div key={article.id} className="border border-gray-200 hover:border-emerald-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
              <div className="relative w-full h-[160px] overflow-hidden">
                <img
                  src={article.imagesLink || "/placeholder/400/250.jpg"}
                  alt={article.header || article.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Eye size={12} />
                  1.2k
                </div>

                {isFeatured && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star size={12} className="fill-current" />
                    Nổi bật
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-emerald-600 font-medium">#{article.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFeatured(article.newsId);
                      }}
                      className={`p-1.5 rounded-full transition-colors ${isFeatured
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      title={isFeatured ? "Bỏ chọn nổi bật" : "Chọn làm nổi bật"}
                    >
                      {isFeatured ? (
                        <Star size={16} className="fill-current" />
                      ) : (
                        <StarOff size={16} />
                      )}
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(article.newsId)}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Chỉnh sửa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
                          <Eye className="w-4 h-4" />
                          <span>Xem chi tiết</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(article.id)}
                          className="flex items-center space-x-2 text-red-600 focus:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa bài viết</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                  {article.title}
                </h3>

                {article.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3 flex-1">
                    {article.excerpt}
                  </p>
                )}

                <div className="space-y-2 mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3.5 w-3.5 mr-1" />
                    <span>{article.author || 'Unknown'}</span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>{formatDate(article.createdAt || "")}</span>
                  </div>

                  {article.category && (
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">
                        {article.category}
                      </span>
                    </div>
                  )}

                  {article.views !== undefined && (
                    <div className="flex items-center text-xs text-gray-500">
                      <TrendingUp className="h-3.5 w-3.5 mr-1" />
                      <span>{article.views.toLocaleString()} lượt xem</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredArticles.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có bài viết</h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all'
                ? "Không tìm thấy bài viết phù hợp với bộ lọc hiện tại"
                : "Chưa có bài viết nào trong hệ thống"}
            </p>
          </div>
        </div>
      )}

      {/* Select All Checkbox (Bottom) */}
      {filteredArticles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">
                Chọn tất cả ({filteredArticles.length} bài viết)
              </span>
            </label>

            <div className="text-sm text-gray-500">
              Đã chọn {selectedArticles.length} / {filteredArticles.length} bài viết
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng bài viết</p>
              <p className="text-2xl font-bold text-emerald-600">{articles.length}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã xuất bản</p>
              <p className="text-2xl font-bold text-green-600">
                {articles.filter(a => a.published).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bản nháp</p>
              <p className="text-2xl font-bold text-gray-600">
                {articles.filter(a => !a.published).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {filteredArticles.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Hiển thị {filteredArticles.length} / {articles.length} bài viết
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseEditModal();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0" aria-describedby={undefined}>
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center">
              <Edit className="w-5 h-5 mr-2 text-emerald-600" />
              Chỉnh sửa bài viết #{selectedNewsId}
            </DialogTitle>
          </DialogHeader>

          {editLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-gray-600">Đang tải thông tin bài viết...</span>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(90vh-10rem)]">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                      <Label htmlFor="header" className="font-medium">
                        Tiêu đề bài viết <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="header"
                        value={editFormData.header}
                        onChange={(e) => handleFormDataChange('header', e.target.value)}
                        placeholder="Nhập tiêu đề bài viết"
                        className="w-full"
                      />
                    </div>

                    {/* Title (description) */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="font-medium">
                        Mô tả ngắn <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={editFormData.title}
                        onChange={(e) => handleFormDataChange('title', e.target.value)}
                        placeholder="Nhập mô tả ngắn"
                        className="w-full"
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <Label htmlFor="content" className="font-medium">
                        Nội dung <span className="text-red-500">*</span>
                      </Label>
                      <textarea
                        id="content"
                        value={editFormData.content}
                        onChange={(e) => handleFormDataChange('content', e.target.value)}
                        placeholder="Nhập nội dung bài viết"
                        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Footer */}
                    <div className="space-y-2">
                      <Label htmlFor="footer" className="font-medium">
                        Kết luận <span className="text-red-500">*</span>
                      </Label>
                      <textarea
                        id="footer"
                        value={editFormData.footer}
                        onChange={(e) => handleFormDataChange('footer', e.target.value)}
                        placeholder="Nhập kết luận"
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-6">
                    {/* Image Preview & Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="image" className="font-medium">
                        Ảnh bìa
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-500 transition-all relative">
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
                            <p className="text-gray-500">Nhấp để tải ảnh lên</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (tối đa 2MB)</p>
                          </div>
                        )}
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Metadata fields */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Time Reading */}
                      <div className="space-y-2">
                        <Label htmlFor="timeReading" className="font-medium">
                          Thời gian đọc (phút) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="timeReading"
                          type="number"
                          min="1"
                          value={editFormData.timeReading}
                          onChange={(e) => handleFormDataChange('timeReading', e.target.value)}
                          placeholder="Nhập thời gian đọc"
                        />
                      </div>

                      {/* Links */}
                      <div className="space-y-2">
                        <Label htmlFor="links" className="font-medium">
                          Liên kết
                        </Label>
                        <Input
                          id="links"
                          value={editFormData.links}
                          onChange={(e) => handleFormDataChange('links', e.target.value)}
                          placeholder="Nhập liên kết"
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Parent Category */}
                      <div className="space-y-2">
                        <Label htmlFor="category" className="font-medium">
                          Danh mục <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="category"
                          value={editFormData.selectedCategory}
                          onChange={(e) => handleFormDataChange('selectedCategory', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((category) => (
                            <option key={category.categoryId} value={category.categoryId}>
                              {category.categoryName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Child Category */}
                      <div className="space-y-2">
                        <Label htmlFor="childCategory" className="font-medium">
                          Danh mục con <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="childCategory"
                          value={editFormData.selectedChildCategory}
                          onChange={(e) => handleFormDataChange('selectedChildCategory', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          disabled={!editFormData.selectedCategory}
                        >
                          <option value="">Chọn danh mục con</option>
                          {childCategories.map((category) => (
                            <option key={category.childrenCategoryID} value={category.childrenCategoryID}>
                              {category.childrenCategoryName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-3 mt-8 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseEditModal}
                    disabled={submitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={submitting}
                    onClick={() => handleSubmit()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}