"use client";

import { useEffect, useState } from "react";
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
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Article = {
  id: number;
  title: string;
  content: string;
  published: boolean;
  author?: string;
  createdAt?: string;
  views?: number;
  category?: string;
  excerpt?: string;
  image?: string;
};

type FilterType = 'all' | 'published' | 'draft';

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Hard-code token từ API (nên thay bằng cách quản lý token hợp lý)
  const valueToken = localStorage.getItem("tokenAdmin");

  // Hàm lấy danh sách tin tức từ API
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
      // Giả sử API trả về mảng tin tức với trường 'newsId' làm id
      const mappedArticles: Article[] = result.data.map((item: any) => ({
        id: item.newsId,
        title: item.title || "",
        content: item.content || "",
        published: item.published,
        author: item.userName || item.author || "",
        createdAt: item.createdDate || "",
        views: Math.floor(Math.random() * 10000), // Mock views
        category: item.categoryName || "",
        excerpt: item.header || "",
        image: item.imagesLink || "",
      }));
      setArticles(mappedArticles);
      setSelectedArticles([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = articles;

    // Filter by publication status
    if (filterType === 'published') {
      filtered = filtered.filter(a => a.published);
    } else if (filterType === 'draft') {
      filtered = filtered.filter(a => !a.published);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  }, [articles, filterType, searchTerm]);

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

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
      // Xóa từng bài viết theo id đã chọn. Có thể dùng Promise.all nếu muốn thực hiện đồng thời.
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
      // Load lại danh sách sau khi xóa
      fetchNews();
      setSuccess(`Đã xóa ${selectedArticles.length} bài viết thành công!`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Hàm xoá bài viết
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
      fetchNews();
      setSuccess("Bài viết đã được xóa thành công!");
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
          Bản nhóp
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
            <p className="text-sm text-gray-500">Tổng số</p>
            <p className="text-2xl font-bold text-emerald-600">{articles.length}</p>
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
          {/* Search and Filter */}
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

          {/* Actions */}
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
        {filteredArticles.map((article) => (
          <div key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Image */}
            <div className="relative h-48 bg-gray-200">
              {article.image ? (
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Checkbox overlay */}
              <div className="absolute top-3 left-3">
                <input
                  type="checkbox"
                  checked={selectedArticles.includes(article.id)}
                  onChange={(e) => handleSelectChange(article.id, e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500"
                />
              </div>

              {/* Status badge */}
              <div className="absolute top-3 right-3">
                {getStatusBadge(article.published)}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-emerald-600 font-medium">#{article.id}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Xem chi tiết</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(article.id)}
                      className="flex items-center space-x-2 text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa bài viết</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {article.title}
              </h3>

              {article.excerpt && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {article.excerpt}
                </p>
              )}

              {/* Meta info */}
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-500">
                  <User className="w-3 h-3 mr-1" />
                  <span>{article.author || 'Unknown'}</span>
                  <span className="mx-2">•</span>
                  <Calendar className="w-3 h-3 mr-1" />
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
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>{article.views.toLocaleString()} lượt xem</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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
    </div>
  );
}