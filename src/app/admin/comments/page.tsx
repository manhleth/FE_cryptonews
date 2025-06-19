"use client";

import { useEffect, useState } from "react";
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Trash2, 
  User,
  Calendar,
  Check,
  AlertCircle,
  FileText
} from "lucide-react";

type Comment = {
  commentId: number;
  userId: number;
  content: string;
  userFullName: string;
  userAvartar: string;
  newsId: number;
  newsTitle?: string;
  createdDate: string;
};

type FilterType = 'all' | 'recent' | 'older';

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
  
  // Lấy token
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
      
      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Lỗi API: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Raw Comment API Response:", result);
      
      // Dựa vào CommentController, API sẽ trả về ResponseData { Data: result, StatusCode: 1 }
      let commentData = [];
      if (result.data) {
        commentData = result.data;
      } else if (result.Data) {
        commentData = result.Data;
      } else if (Array.isArray(result)) {
        // Trường hợp trả về trực tiếp array
        commentData = result;
      }
      
      if (!Array.isArray(commentData)) {
        console.error("Unexpected API response structure:", result);
        throw new Error("Dữ liệu API không đúng định dạng");
      }

      console.log("Comment data array:", commentData);
      if (commentData.length > 0) {
        console.log("First comment structure:", commentData[0]);
      }

      // Lấy danh sách tất cả news để map với comment
      const newsResponse = await fetch("http://localhost:5000/api/News/GetAllNewAdmin", {
        headers: {
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      
      let allNews = [];
      if (newsResponse.ok) {
        const newsResult = await newsResponse.json();
        console.log("All News API Response:", newsResult);
        if (newsResult.data) {
          allNews = newsResult.data;
        } else if (newsResult.Data) {
          allNews = newsResult.Data;
        } else if (Array.isArray(newsResult)) {
          allNews = newsResult;
        }
      }

      // Map comments với thông tin từ news
      const commentsWithNewsInfo = commentData.map((comment: any) => {
        // Dựa vào ListCommentResponseDto structure sau khi update:
        // CommentId, UserId, Content, UserFullName, UserAvartar, NewsId, CreatedDate
        const commentId = comment.commentId || comment.CommentId;
        const userId = comment.userId || comment.UserId;
        const content = comment.content || comment.Content;
        const userFullName = comment.userFullName || comment.UserFullName;
        const userAvatar = comment.userAvartar || comment.UserAvartar;
        const newsId = comment.newsId || comment.NewsId;
        const createdDate = comment.createdDate || comment.CreatedDate;

        // Tìm news tương ứng
        let newsTitle = "Không xác định";
        if (newsId && allNews.length > 0) {
          const relatedNews = allNews.find((news: any) => {
            const newsIdToCompare = news.newsId || news.NewsId || news.id;
            return newsIdToCompare === newsId;
          });
          if (relatedNews) {
            newsTitle = relatedNews.title || relatedNews.Title || relatedNews.header || relatedNews.Header || "Không có tiêu đề";
          }
        }

        const mappedComment = {
          commentId: commentId,
          userId: userId,
          content: content || "Không có nội dung",
          userFullName: userFullName || "Không xác định",
          userAvartar: userAvatar || "",
          newsId: newsId,
          newsTitle: newsTitle,
          createdDate: createdDate || new Date().toISOString(),
        };

        console.log("Mapped comment:", mappedComment);
        return mappedComment;
      });

      setComments(commentsWithNewsInfo);
      setSelectedComments([]);
    } catch (err: any) {
      console.error("Fetch comments error:", err);
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

    // Filter by date
    if (filterType === 'recent') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filtered = filtered.filter(c => new Date(c.createdDate) >= threeDaysAgo);
    } else if (filterType === 'older') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filtered = filtered.filter(c => new Date(c.createdDate) < threeDaysAgo);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.userFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.newsTitle && c.newsTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort by createdDate descending (newest first)
    filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

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
      
      setComments(comments.filter((c) => c.commentId !== id));
      setSuccess("Bình luận đã được xóa thành công!");
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
      const allIds = filteredComments.map((comment) => comment.commentId);
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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
              <p className="text-gray-600">Xem và xóa bình luận từ người dùng</p>
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
                placeholder="Tìm kiếm bình luận, tác giả hoặc bài viết..."
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
                <option value="recent">3 ngày gần đây</option>
                <option value="older">Cũ hơn 3 ngày</option>
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
                  Nội dung bình luận
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bài viết
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
                <tr key={comment.commentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.commentId)}
                      onChange={(e) => handleSelectChange(comment.commentId, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {comment.userAvartar ? (
                          <img 
                            src={comment.userAvartar} 
                            alt={comment.userFullName} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{comment.userFullName}</p>
                        <p className="text-xs text-gray-500">ID: {comment.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-sm">
                      <p className="text-sm text-gray-900" title={comment.content}>
                        {truncateText(comment.content, 150)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900 font-medium" title={comment.newsTitle}>
                            {truncateText(comment.newsTitle || "Không xác định", 60)}
                          </p>
                          <p className="text-xs text-gray-500">ID: {comment.newsId}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(comment.createdDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(comment.commentId)}
                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      title="Xóa bình luận"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p className="text-sm text-gray-600">Hiển thị</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredComments.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
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