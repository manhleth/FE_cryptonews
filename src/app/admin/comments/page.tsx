"use client";

import { useEffect, useState } from "react";
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  EyeOff,
  User,
  Calendar,
  MoreVertical,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Comment = {
  id: number;
  author: string;
  content: string;
  approved: boolean;
  createdAt?: string;
  newsTitle?: string;
  avatar?: string;
};

type FilterType = 'all' | 'approved' | 'pending';

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  
  // Lấy token (nếu cần)
  const valueToken = localStorage.getItem("tokenAdmin");

  // Hàm lấy danh sách comment từ API
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/Comment/GetAllCommentAdmin", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách bình luận");
      }
      const result = await response.json();
      // Giả sử API trả về dạng { statusCode: 1, data: [...] }
      if (result.statusCode !== 1 || !result.data) {
        throw new Error("Lỗi dữ liệu từ API");
      }
      // Nếu API trả về key khác, hãy chỉnh sửa phần mapping này
      const mappedComments: Comment[] = result.data.map((item: any) => ({
        id: item.commentId, // Giả sử API trả về commentId
        author: item.author || item.userFullName || "",
        content: item.content || "",
        approved: item.approved || false,
        createdAt: item.createdAt || "",
        newsTitle: item.newsTitle || "",
        avatar: item.userAvartar || "",
      }));
      setComments(mappedComments);
      // Reset danh sách đã chọn sau khi load lại
      setSelectedComments([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // Filter và search effect
  useEffect(() => {
    let filtered = comments;

    // Filter by approval status
    if (filterType === 'approved') {
      filtered = filtered.filter(c => c.approved);
    } else if (filterType === 'pending') {
      filtered = filtered.filter(c => !c.approved);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredComments(filtered);
  }, [comments, filterType, searchTerm]);

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

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/Comment/DeleteCommentByAdmin?commentID=${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Lỗi khi xóa bình luận");
      }
      
      setComments(comments.filter((c) => c.id !== id));
      setSuccess("Bình luận đã được xóa thành công!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveToggle = async (id: number) => {
    const comment = comments.find(c => c.id === id);
    if (!comment) return;

    try {
      // Giả sử có API endpoint để toggle approval
      // const response = await fetch(`http://localhost:5000/api/Comment/ToggleApproval?commentID=${id}`, {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Bearer ${valueToken}`,
      //   },
      // });

      // Tạm thời update local state
      setComments(
        comments.map((c) =>
          c.id === id ? { ...c, approved: !c.approved } : c
        )
      );
      setSuccess(`Bình luận đã được ${!comment.approved ? 'duyệt' : 'bỏ duyệt'}!`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Xử lý chọn bỏ checkbox của từng comment
  const handleSelectChange = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedComments((prev) => [...prev, id]);
    } else {
      setSelectedComments((prev) => prev.filter((item) => item !== id));
    }
  };

  // Xử lý chọn/bỏ chọn tất cả
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredComments.map((comment) => comment.id);
      setSelectedComments(allIds);
    } else {
      setSelectedComments([]);
    }
  };

  // Xoá nhiều comment được chọn
  const handleBulkDelete = async () => {
    if (selectedComments.length === 0) {
      setError("Vui lòng chọn ít nhất một bình luận để xóa.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa những bình luận đã chọn?")) return;

    try {
      // Xóa từng comment đã chọn (thực hiện đồng thời với Promise.all)
      await Promise.all(
        selectedComments.map((id) =>
          fetch(`http://localhost:5000/api/Comment/DeleteCommentByAdmin?commentID=${id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${valueToken}`,
            },
          })
        )
      );
      // Sau khi xoá, load lại danh sách comment
      fetchComments();
      setSuccess(`Đã xóa ${selectedComments.length} bình luận thành công!`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Kiểm tra xem tất cả các comment đã được chọn hay chưa
  const allSelected = filteredComments.length > 0 && selectedComments.length === filteredComments.length;

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

  const getApprovalBadge = (approved: boolean) => {
    if (approved) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <Check className="w-3 h-3 mr-1" />
          Đã duyệt
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Chờ duyệt
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý bình luận</h1>
              <p className="text-gray-600">Duyệt và quản lý bình luận từ người dùng</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tổng số</p>
            <p className="text-2xl font-bold text-blue-600">{comments.length}</p>
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
                placeholder="Tìm kiếm bình luận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="approved">Đã duyệt</option>
                <option value="pending">Chờ duyệt</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleBulkDelete}
              disabled={selectedComments.length === 0}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa đã chọn ({selectedComments.length})
            </button>
          </div>
        </div>
      </div>

      {/* Comments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tác giả
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nội dung
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={(e) => handleSelectChange(comment.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {comment.avatar ? (
                          <img 
                            src={comment.avatar} 
                            alt={comment.author} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{comment.author}</p>
                        <p className="text-xs text-gray-500">#{comment.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <p className="text-sm text-gray-900 line-clamp-3">{comment.content}</p>
                      {comment.newsTitle && (
                        <p className="text-xs text-gray-500 mt-1">Bài viết: {comment.newsTitle}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getApprovalBadge(comment.approved)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(comment.createdAt || "")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-transparent border border-transparent rounded-lg hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleApproveToggle(comment.id)}
                          className="flex items-center space-x-2"
                        >
                          {comment.approved ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              <span>Bỏ duyệt</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              <span>Duyệt bình luận</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(comment.id)}
                          className="flex items-center space-x-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa bình luận</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredComments.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center" colSpan={6}>
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <MessageCircle className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">
                        {searchTerm || filterType !== 'all' 
                          ? "Không tìm thấy bình luận phù hợp" 
                          : "Chưa có bình luận nào"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng bình luận</p>
              <p className="text-2xl font-bold text-blue-600">{comments.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-600">
                {comments.filter(c => c.approved).length}
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
              <p className="text-sm text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-600">
                {comments.filter(c => !c.approved).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {filteredComments.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Hiển thị {filteredComments.length} / {comments.length} bình luận
        </div>
      )}
    </div>
  );
}