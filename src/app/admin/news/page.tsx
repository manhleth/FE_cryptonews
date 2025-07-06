"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Star,
  StarOff,
  Edit3,
  Trash2,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Clock,
  Tag,
  X,
  Save,
  AlertTriangle,
  CheckCircle,
  FileText,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Hash,
  Bold,
  Italic,
  Quote,
  List,
  ArrowRight,
  BookOpen
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface NewsItem {
  newsId: number;
  header: string;
  title: string;
  content: string;
  footer: string;
  timeReading: number;
  userName: string;
  avatar?: string;
  categoryId: number;
  imagesLink: string;
  links?: string;
  userId: number;
  childrenCategoryId?: number;
  createdDate: string;
  modifiedDate?: string;
  isFeatured?: boolean;
  featuredOrder?: number;
}

interface EditFormData {
  newsId: number;
  header: string;
  title: string;
  content: string;
  timeReading: number;
}

type SortField = 'newsId' | 'header' | 'userName' | 'createdDate' | 'categoryId';
type SortDirection = 'asc' | 'desc';

export default function AdminNewsPage() {
  // States
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('createdDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    newsId: 0,
    header: "",
    title: "",
    content: "",
    timeReading: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Get admin token
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("tokenAdmin") : null;

  // Categories state - will be loaded from API
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/Category/GetAllCategories");
        if (response.ok) {
          const result = await response.json();
          if (result.statusCode === 1 && result.data) {
            setCategories(result.data.map((cat: any) => ({
              id: cat.categoryId,
              name: cat.categoryName
            })));
          }
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    if (adminToken) {
      loadNews();
      loadFeaturedNews();
      loadCategories();
    }
  }, [adminToken]);

  // Filter and search effect
  useEffect(() => {
    let filtered = newsList;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(news => news.categoryId.toString() === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(news => 
        news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        news.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
        news.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'createdDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredNews(filtered);
  }, [newsList, selectedCategory, searchTerm, sortField, sortDirection]);

  // API calls
  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/News/GetAllNewAdmin", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tải danh sách tin tức");
      }

      const result = await response.json();
      if (result.statusCode === 1 && result.data) {
        setNewsList(result.data);
      } else {
        throw new Error("Dữ liệu không hợp lệ");
      }
    } catch (error: any) {
      console.error("Error loading news:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách tin tức",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedNews = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/News/GetFeaturedNews");
      
      if (response.ok) {
        const result = await response.json();
        if (result.statusCode === 1 && result.data) {
          setFeaturedNews(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading featured news:", error);
    }
  };

  const handleSetFeatured = async (newsId: number, isFeatured: boolean) => {
    try {
      if (isFeatured && featuredNews.length >= 2) {
        toast({
          title: "Giới hạn đạt",
          description: "Đã đạt giới hạn 2 tin tức nổi bật. Vui lòng bỏ chọn một bài viết khác trước.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/News/SetFeaturedNews?newsId=${newsId}&isFeatured=${isFeatured}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${adminToken}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok && result.statusCode === 1) {
        // Update local state
        setNewsList(prev => prev.map(news => 
          news.newsId === newsId 
            ? { ...news, isFeatured, featuredOrder: isFeatured ? (featuredNews.length + 1) : undefined }
            : news
        ));
        
        // Reload featured news
        loadFeaturedNews();
        
        toast({
          title: "Thành công",
          description: isFeatured ? "Đã đặt tin tức nổi bật" : "Đã bỏ tin tức nổi bật",
          duration: 3000
        });
      } else {
        throw new Error(result.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error setting featured:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật tin tức nổi bật",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedNews) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `http://localhost:5000/api/News/AdminDelele?id=${selectedNews.newsId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${adminToken}`,
          },
        }
      );

      if (response.ok) {
        setNewsList(prev => prev.filter(news => news.newsId !== selectedNews.newsId));
        setShowDeleteModal(false);
        setSelectedNews(null);
        
        toast({
          title: "Thành công",
          description: "Xóa tin tức thành công",
          duration: 3000
        });
      } else {
        throw new Error("Lỗi khi xóa tin tức");
      }
    } catch (error: any) {
      console.error("Error deleting news:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa tin tức",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      
      // Tạo JSON object thay vì FormData
      const updateData = {
        newsId: editFormData.newsId,
        header: editFormData.header,
        title: editFormData.title,
        content: editFormData.content,
        footer: "",
        timeReading: editFormData.timeReading,
        links: ""
      };

      console.log("Sending edit data:", updateData);

      const response = await fetch("http://localhost:5000/api/News/UpdateNews", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json", // Đổi sang JSON
        },
        body: JSON.stringify(updateData), // Gửi JSON thay vì FormData
      });

      console.log("Update response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update response error:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Update response data:", result);
      
      if (result.statusCode === 1) {
        // Update local state với các field đã chỉnh sửa
        setNewsList(prev => prev.map(news => 
          news.newsId === editFormData.newsId 
            ? { 
                ...news, 
                header: editFormData.header,
                title: editFormData.title,
                content: editFormData.content,
                timeReading: editFormData.timeReading,
                modifiedDate: new Date().toISOString() 
              }
            : news
        ));
        
        setShowEditModal(false);
        setSelectedNews(null);
        
        toast({
          title: "Thành công",
          description: "Cập nhật tin tức thành công",
          duration: 3000
        });
      } else {
        throw new Error(result.message || "API trả về lỗi");
      }
    } catch (error: any) {
      console.error("Error updating news:", error);
      
      // Hiển thị lỗi chi tiết hơn
      let errorMessage = "Không thể cập nhật tin tức";
      if (error.message.includes("415")) {
        errorMessage = "Backend không hỗ trợ định dạng dữ liệu này";
      } else if (error.message.includes("HTTP error")) {
        errorMessage = "Lỗi kết nối với server";
      } else if (error.message.includes("API")) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Lỗi cập nhật",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId)?.name || "Khác";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const openEditModal = (news: NewsItem) => {
    setSelectedNews(news);
    setEditFormData({
      newsId: news.newsId,
      header: news.header || "",
      title: news.title || "",
      content: news.content || "",
      timeReading: news.timeReading || 1
    });
    setShowEditModal(true);
  };

  // Helper function để chèn text vào textarea
  const insertTextIntoContent = (textToInsert: string, wrapSelected: boolean = false) => {
    const textarea = document.getElementById('edit-content') as HTMLTextAreaElement;
    if (!textarea || editFormData.content === null || editFormData.content === undefined) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    let newText: string;
    
    if (wrapSelected && start !== end) {
      // Wrap selected text
      const selectedText = editFormData.content.substring(start, end);
      newText = editFormData.content.substring(0, start) + textToInsert + selectedText + textToInsert + editFormData.content.substring(end);
    } else {
      // Insert at cursor position
      newText = editFormData.content.substring(0, start) + textToInsert + editFormData.content.substring(end);
    }
    
    setEditFormData(prev => ({...prev, content: newText}));
    
    setTimeout(() => {
      textarea.focus();
      if (wrapSelected && start !== end) {
        textarea.setSelectionRange(start + textToInsert.length, end + textToInsert.length);
      } else {
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }
    }, 0);
  };

  const openDeleteModal = (news: NewsItem) => {
    setSelectedNews(news);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600">Đang tải...</span>
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
              <p className="text-gray-600">Quản lý, chỉnh sửa và đặt tin tức nổi bật</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tổng số</p>
            <p className="text-2xl font-bold text-emerald-600">{newsList.length}</p>
          </div>
        </div>
      </div>

      {/* Featured News Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="mr-2 text-yellow-500" size={24} />
          Tin tức nổi bật ({featuredNews.length}/2)
        </h2>
        
        {featuredNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredNews.map((news) => (
              <div key={news.newsId} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-start space-x-3">
                  <img 
                    src={news.imagesLink || "/placeholder/64/64"} 
                    alt={news.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-2">{news.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Thứ tự: {news.featuredOrder} • {getCategoryName(news.categoryId)}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <button
                        onClick={() => handleSetFeatured(news.newsId, false)}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center"
                      >
                        <StarOff size={16} className="mr-1" />
                        Bỏ nổi bật
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Chưa có tin tức nổi bật nào</p>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Tìm kiếm tin tức..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* News Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Danh sách tin tức ({filteredNews.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('newsId')}
                    className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
                  >
                    <span>ID</span>
                    {getSortIcon('newsId')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">Nội dung</th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('userName')}
                    className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
                  >
                    <span>Tác giả</span>
                    {getSortIcon('userName')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('categoryId')}
                    className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
                  >
                    <span>Danh mục</span>
                    {getSortIcon('categoryId')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('createdDate')}
                    className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
                  >
                    <span>Ngày tạo</span>
                    {getSortIcon('createdDate')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNews.map((news) => (
                <tr key={news.newsId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">#{news.newsId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <img 
                        src={news.imagesLink || "/placeholder/64/64"} 
                        alt={news.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {news.header || news.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{news.content}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {news.timeReading} phút đọc
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{news.userName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryName(news.categoryId)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(news.createdDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(news)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                      >
                        <Edit3 size={12} className="mr-1" />
                        Sửa
                      </button>
                      
                      <button
                        onClick={() => handleSetFeatured(news.newsId, !news.isFeatured)}
                        disabled={!news.isFeatured && featuredNews.length >= 2}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${
                          news.isFeatured
                            ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
                            : featuredNews.length >= 2
                            ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                            : 'text-yellow-700 bg-white hover:bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        {news.isFeatured ? <StarOff size={12} className="mr-1" /> : <Star size={12} className="mr-1" />}
                        {news.isFeatured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                      </button>
                      
                      <button
                        onClick={() => openDeleteModal(news)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                      >
                        <Trash2 size={12} className="mr-1" />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredNews.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy tin tức</h3>
            <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedNews && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="text-red-500 mr-3" size={24} />
                Xác nhận xóa
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn xóa tin tức "{selectedNews.title}"? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <img 
                    src={selectedNews.imagesLink || "/placeholder/48/48"} 
                    alt={selectedNews.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-red-900">{selectedNews.header}</p>
                    <p className="text-xs text-red-700">ID: #{selectedNews.newsId}</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xóa..." : "Xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedNews && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-hidden p-0">
            <div className="p-6 max-h-[95vh] overflow-y-auto">
              <DialogHeader className="mb-6">
                <DialogTitle className="flex items-center">
                  <Edit3 className="text-emerald-600 mr-3" size={24} />
                  Chỉnh sửa tin tức
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-6">
                  {/* Thông tin không thể sửa - Hiển thị read-only */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin cố định (không thể sửa)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">ID</label>
                        <div className="text-sm text-gray-900 font-mono">#{selectedNews.newsId}</div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Danh mục</label>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(selectedNews.categoryId)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tác giả</label>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-sm text-gray-900">{selectedNews.userName}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hình ảnh</label>
                        <img 
                          src={selectedNews.imagesLink || "/placeholder/48/48"} 
                          alt="Ảnh bài viết"
                          className="w-12 h-12 object-cover rounded border"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ngày tạo</label>
                        <div className="text-sm text-gray-900">{formatDate(selectedNews.createdDate)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Phần có thể chỉnh sửa */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-emerald-700 mb-3 flex items-center">
                      <Edit3 size={16} className="mr-2" />
                      Nội dung có thể chỉnh sửa
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiêu đề phụ <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={editFormData.header}
                        onChange={(e) => setEditFormData(prev => ({...prev, header: e.target.value}))}
                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Nhập tiêu đề phụ..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiêu đề chính <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={editFormData.title}
                        onChange={(e) => setEditFormData(prev => ({...prev, title: e.target.value}))}
                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Nhập tiêu đề chính..."
                        required
                      />
                    </div>
                    
                    {/* Enhanced Content Editor with Toolbar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung bài viết <span className="text-red-500">*</span>
                      </label>
                      
                      {/* Editor Toolbar */}
                      <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-3">
                        {/* Format options */}
                        <div className="mb-3">
                          <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                            <Hash className="w-3 h-3 mr-1" />
                            Định dạng
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => insertTextIntoContent('\n\n# ')}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              title="Tiêu đề lớn"
                            >
                              <Hash className="w-3 h-3" />
                              H1
                            </button>
                            <button
                              type="button"
                              onClick={() => insertTextIntoContent('\n\n## ')}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              title="Tiêu đề phụ"
                            >
                              <Hash className="w-3 h-3" />
                              H2
                            </button>
                            <button
                              type="button"
                              onClick={() => insertTextIntoContent('**', true)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              title="Làm đậm"
                            >
                              <Bold className="w-3 h-3" />
                              Đậm
                            </button>
                            <button
                              type="button"
                              onClick={() => insertTextIntoContent('*', true)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              title="Làm nghiêng"
                            >
                              <Italic className="w-3 h-3" />
                              Nghiêng
                            </button>
                            <button
                              type="button"
                              onClick={() => insertTextIntoContent('\n\n> ')}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              title="Trích dẫn"
                            >
                              <Quote className="w-3 h-3" />
                              Trích dẫn
                            </button>
                            <button
                              type="button"
                              onClick={() => insertTextIntoContent('\n\n• ')}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              title="Danh sách"
                            >
                              <List className="w-3 h-3" />
                              Danh sách
                            </button>
                          </div>
                        </div>

                        {/* Special characters */}
                        <div className="mb-3">
                          <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            Ký tự đặc biệt
                          </h4>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {["—", "–", "•", "→", "←", "★", "☆", "✓", "✗", "⚡", "🔥", "💡", "📌", "⭐", "🎯"].map((char, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => insertTextIntoContent(char)}
                                className="px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              >
                                {char}
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
                            {[
                              { name: "Phân cách", content: "\n\n— — — — —\n\n" },
                              { name: "Sao", content: "\n\n★ ★ ★ ★ ★\n\n" },
                              { name: "Thông tin", content: "\n\n📌 **THÔNG TIN QUAN TRỌNG:**\n\n• \n• \n• \n\n" },
                              { name: "Kết luận", content: "\n\n🎯 **KẾT LUẬN:**\n\n" }
                            ].map((template, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => insertTextIntoContent(template.content)}
                                className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                              >
                                {template.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <textarea
                        id="edit-content"
                        value={editFormData.content}
                        onChange={(e) => setEditFormData(prev => ({...prev, content: e.target.value}))}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
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
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ký tự: {editFormData.content?.length || 0}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thời gian đọc (phút) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        value={editFormData.timeReading}
                        onChange={(e) => setEditFormData(prev => ({...prev, timeReading: parseInt(e.target.value) || 1}))}
                        className="w-32 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Thời gian ước tính để đọc hết bài viết
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="sticky top-0">
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-emerald-600" />
                        Xem trước bài viết
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Đây là cách bài viết sẽ hiển thị sau khi chỉnh sửa
                      </p>
                    </div>

                    {/* Preview Content */}
                    <div className="space-y-6">
                      {/* Header Image Preview */}
                      <div className="aspect-video relative overflow-hidden rounded-lg">
                        <img
                          src={selectedNews.imagesLink || "/placeholder/400/250"}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      </div>

                      {/* Article Header */}
                      <header className="space-y-4">
                        {editFormData.header && (
                          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                            {editFormData.header}
                          </h1>
                        )}

                        {/* Author Info Preview */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{selectedNews.userName}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                <span>{editFormData.timeReading || "0"} phút đọc</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(selectedNews.createdDate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Title/Description */}
                        {editFormData.title && (
                          <div className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                            <p className="text-emerald-800 font-medium">{editFormData.title}</p>
                          </div>
                        )}
                      </header>

                      {/* Content Preview */}
                      <div className="prose prose-lg max-w-none">
                        <div className="text-gray-700 leading-relaxed">
                          {editFormData.content ? (
                            <div className="space-y-4">
                              {editFormData.content.split('\n').map((line, index) => {
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
                              })}
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
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {getCategoryName(selectedNews.categoryId)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="bg-gray-50 rounded-lg p-4 mt-6">
                <div className="flex items-center justify-between w-full">
                  <p className="text-xs text-gray-500">
                    Có thể chỉnh sửa: tiêu đề, nội dung và thời gian đọc
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditModal(false)}
                      disabled={isSubmitting}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleEdit}
                      disabled={isSubmitting || !editFormData.header.trim() || !editFormData.title.trim() || !editFormData.content.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Results Summary */}
      {filteredNews.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Hiển thị {filteredNews.length} / {newsList.length} tin tức
        </div>
      )}
    </div>
  );
}