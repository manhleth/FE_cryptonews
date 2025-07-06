"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Share2, BookmarkIcon, Clock, User, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import Link from "next/link";

interface NewsData {
  newsId?: number;
  newsID?: number;
  header: string;
  title: string;
  content: string;
  footer: string;
  timeReading: number;
  userName: string;
  avatar: string;
  categoryId: number;
  imagesLink: string;
  createdDate?: string;
  userAvartar?: string; 
}

interface Comment {
  commentId: number;
  userId: number;
  userFullName: string;
  userAvartar: string;
  content: string;
  createdDate?: string | null;
}

export default function NewsDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { token, user } = useAuth();
  
  // Analytics hooks and refs
  const { trackNewsView, trackActivity } = useAnalytics();
  const sessionStartTime = useRef<number>(Date.now());
  const hasTrackedView = useRef<boolean>(false);
  
  // States
  const [item, setItem] = useState<NewsData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<NewsData[]>([]);
  const [newestPosts, setNewestPosts] = useState<NewsData[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingNewest, setLoadingNewest] = useState(false);

  // Format content for display - SAME AS PREVIEW
  const formatContentForDisplay = (text: string) => {
    if (!text) return "";
    
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold mb-6 text-gray-900 mt-8 first:mt-0">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold mb-4 text-gray-800 mt-6 first:mt-0">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium mb-3 text-gray-700 mt-5 first:mt-0">{line.substring(4)}</h3>;
      }
      
      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-4 border-emerald-400 pl-6 py-3 my-4 bg-emerald-50 italic text-gray-700 rounded-r-lg">
            <p className="text-lg leading-relaxed">{line.substring(2)}</p>
          </blockquote>
        );
      }
      
      // Lists
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={index} className="ml-6 mb-2 text-gray-700 text-lg leading-relaxed list-disc">
            {line.substring(2)}
          </li>
        );
      }
      
      // Bold and italic text
      let processedLine = line;
      
      // Bold **text**
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
      
      // Italic *text*
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>');
      
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="my-4" />;
      }
      
      // Horizontal rules (— — — — —)
      if (line.trim().match(/^[—\-]{3,}$/)) {
        return <hr key={index} className="my-8 border-t-2 border-emerald-200" />;
      }
      
      // Star separators (★ ★ ★ ★ ★)
      if (line.trim().match(/^[★☆✦✧]{3,}$/)) {
        return (
          <div key={index} className="text-center my-8">
            <div className="text-emerald-400 text-2xl tracking-widest">{line.trim()}</div>
          </div>
        );
      }
      
      // Info boxes (📌 **THÔNG TIN QUAN TRỌNG:**)
      if (line.includes('📌') && line.includes('**')) {
        return (
          <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-4 my-6 rounded-r-lg">
            <p 
              className="text-blue-800 font-medium text-lg"
              dangerouslySetInnerHTML={{ __html: processedLine }}
            />
          </div>
        );
      }
      
      // Conclusion boxes (🎯 **KẾT LUẬN:**)
      if (line.includes('🎯') && line.includes('**')) {
        return (
          <div key={index} className="bg-green-50 border-l-4 border-green-400 p-4 my-6 rounded-r-lg">
            <p 
              className="text-green-800 font-medium text-lg"
              dangerouslySetInnerHTML={{ __html: processedLine }}
            />
          </div>
        );
      }
      
      // Regular paragraphs
      return (
        <p 
          key={index} 
          className="mb-4 text-gray-700 leading-relaxed text-lg"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });
  };

  // Helper functions - Sử dụng cùng logic với ngày đăng bài
  const formatTimeAgo = (date?: string | Date | null) => {
    if (!date) return 'vừa xong';
    
    const now = new Date();
    const targetDate = new Date(date);
    
    // Kiểm tra nếu date không hợp lệ
    if (isNaN(targetDate.getTime())) {
      return 'vừa xong';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
    return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
  };

  // Track initial news view when component mounts
  useEffect(() => {
    if (id && !hasTrackedView.current) {
      sessionStartTime.current = Date.now();
      trackNewsView(Number(id));
      hasTrackedView.current = true;
    }
  }, [id, trackNewsView]);

  // Track session duration when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (id) {
        const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        trackNewsView(Number(id), sessionDuration);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && id) {
        const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        if (sessionDuration > 10) {
          trackNewsView(Number(id), sessionDuration);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [id, trackNewsView]);

  // Fetch news data
  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        setIsInitialLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:5000/api/News/GetNewsByIdAsync?id=${id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.statusCode === 1 && data.data) {
          setItem(data.data);
        } else {
          setError("Không tìm thấy bài viết");
        }
      } catch (error: any) {
        setError(error.message || "Có lỗi xảy ra khi tải bài viết");
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (id) {
      fetchNewsData();
    }
  }, [id]);

  // Fetch newest posts
  useEffect(() => {
    const fetchNewestPosts = async () => {
      try {
        setLoadingNewest(true);
        const response = await fetch(`http://localhost:5000/api/News/GetNewest`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.statusCode === 1 && data.data) {
          const filteredPosts = data.data
            .filter((post: NewsData) => (post.newsId || post.newsID) != Number(id))
            .slice(0, 4);
          
          setNewestPosts(filteredPosts);
        }
      } catch (error) {
        console.error("Error fetching newest posts:", error);
      } finally {
        setLoadingNewest(false);
      }
    };

    if (id) {
      fetchNewestPosts();
    }
  }, [id]);

  // Fetch related posts when we have categoryId
  useEffect(() => {
    if (!item || !item.categoryId) return;

    const fetchRelatedPosts = async () => {
      try {
        setLoadingRelated(true);
        const response = await fetch(`http://localhost:5000/api/News/GetNewsByCategoryTop?category=${item.categoryId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.statusCode === 1 && data.data) {
          const filteredPosts = data.data
            .filter((post: NewsData) => (post.newsId || post.newsID) != Number(id))
            .slice(0, 3);
          
          setRelatedPosts(filteredPosts);
        }
      } catch (error) {
        console.error("Error fetching related posts:", error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedPosts();
  }, [item, id]);

  // Fetch saved status
  useEffect(() => {
    if (!token || !item) return;

    const fetchSavedNews = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/Saved/GetYourListSaved', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.statusCode === 1 && data.data) {
          const savedItems = Array.isArray(data.data) ? data.data : [];
          
          const isCurrentNewsSaved = savedItems.some((saved: any) => {
            return saved.newsId == Number(id) || saved.newsID == Number(id) || saved.NewsId == Number(id) || saved.NewsID == Number(id);
          });
          
          setIsSaved(isCurrentNewsSaved);
        } else {
          setIsSaved(false);
        }
      } catch (error) {
        console.error("Error fetching saved news:", error);
        setIsSaved(false);
      }
    };

    fetchSavedNews();
  }, [token, id, item]);

  // Fetch comments - FIXED VERSION - Work for both logged in and anonymous users
  useEffect(() => {
    if (!id) return; // Chỉ cần có id, không cần item

    const fetchComments = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/Comment/GetListCommentByNews?newsID=${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.statusCode === 1) {
          // Đảm bảo comments được sắp xếp theo thứ tự mới nhất
          const sortedComments = (data.data || []).sort((a: Comment, b: Comment) => {
            if (!a.createdDate && !b.createdDate) return 0;
            if (!a.createdDate) return 1;
            if (!b.createdDate) return -1;
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });
          
          setComments(sortedComments);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        setComments([]); // Set empty array on error, không block UI
      }
    };

    fetchComments();
  }, [id]); // Chỉ depend vào id, không depend vào item

  // Handle comment submission - IMPROVED VERSION
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;

    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/Comment/CreateNewComment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newsId: Number(id),
          content: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.statusCode === 1) {
        // Refresh comments list để lấy comment mới từ server với đầy đủ thông tin
        const commentsResponse = await fetch(`http://localhost:5000/api/Comment/GetListCommentByNews?newsID=${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          if (commentsData && commentsData.statusCode === 1) {
            const sortedComments = (commentsData.data || []).sort((a: Comment, b: Comment) => {
              if (!a.createdDate && !b.createdDate) return 0;
              if (!a.createdDate) return 1;
              if (!b.createdDate) return -1;
              return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
            });
            setComments(sortedComments);
          }
        }

        setNewComment("");

        // Track comment activity
        if (trackActivity) {
          trackActivity({
            activityType: 'COMMENT',
            relatedNewsId: Number(id)
          });
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Có lỗi xảy ra khi thêm bình luận. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Handle bookmark click
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert("Vui lòng đăng nhập để lưu bài viết này");
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/Saved/AddOrRemoveSaved?newsID=${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.statusCode === 1) {
        setIsSaved(prev => !prev);

        // Track save post activity
        if (trackActivity) {
          trackActivity({
            activityType: 'SAVE_POST',
            relatedNewsId: Number(id)
          });
        }
      } else {
        console.error("API returned error:", data);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      alert("Đã sao chép liên kết bài viết!");
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // Loading state
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="animate-pulse space-y-6">
                <div className="space-y-4">
                  <div className="h-8 bg-emerald-100 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-emerald-100 rounded w-1/2"></div>
                </div>
                <div className="h-64 bg-emerald-100 rounded-xl"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-emerald-100 rounded w-full"></div>
                  <div className="h-4 bg-emerald-100 rounded w-5/6"></div>
                  <div className="h-4 bg-emerald-100 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center py-12 px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // No item found
  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center py-12 px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">📄</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết</h2>
          <p className="text-gray-600">Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-100">
              {/* Hero Image */}
              <div className="aspect-[16/10] relative overflow-hidden">
                <img
                  src={item.imagesLink || "/placeholder/800/400.jpg"}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              <div className="p-8">
                {/* Header */}
                <header className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    {item.header}
                  </h1>

                  {/* Title/Description */}
                  {item.title && (
                    <div className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400 mb-6">
                      <p className="text-emerald-800 font-medium text-lg">{item.title}</p>
                    </div>
                  )}

                  {/* Author Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={item.avatar || item.userAvartar || "/placeholder/48/48.jpg"} 
                      alt={item.userName} 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder/48/48.jpg";
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.userName}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{item.timeReading} phút đọc</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{item.createdDate ? formatTimeAgo(item.createdDate) : 'Hôm nay'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-emerald-100">
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors duration-200 font-medium"
                    >
                      <Share2 className="w-4 h-4" />
                      Chia sẻ
                    </button>

                    <button
                      onClick={handleBookmarkClick}
                      disabled={loading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                        isSaved 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <BookmarkIcon className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? 'Đã lưu' : 'Lưu bài'}
                    </button>
                  </div>
                </header>

                {/* Content with Formatting */}
                <div className="prose prose-lg max-w-none mb-12">
                  <div className="text-gray-700 leading-relaxed">
                    {formatContentForDisplay(item.content)}
                  </div>
                </div>

                {/* Comments Section - IMPROVED */}
                <div className="border-t border-emerald-100 pt-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-600 rounded-full"></span>
                    Bình luận ({comments.length})
                  </h2>

                  {/* Comment Form */}
                  {token ? (
                    <form onSubmit={handleSubmitComment} className="flex items-start gap-3 mb-6">
                      <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={user?.avatar || "/default-avatar.png"}
                          alt={user?.fullname || user?.username || "User"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Viết bình luận của bạn..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button
                          type="submit"
                          disabled={loading || !newComment.trim()}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            loading || !newComment.trim()
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          {loading ? 'Đang gửi...' : 'Gửi'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mb-6 p-3 bg-emerald-50 rounded-lg text-center border border-emerald-200">
                      <p className="text-emerald-800 text-sm">
                        <Link href="/User/Login" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                          Đăng nhập
                        </Link>{" "}
                        để tham gia thảo luận về bài viết này
                      </p>
                    </div>
                  )}

                  {/* Comments List - IMPROVED */}
                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      comments.slice(0, visibleCount).map((comment, index) => (
                        <div key={comment.commentId || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                            <img
                              src={comment.userAvartar || "/default-avatar.png"}
                              alt={comment.userFullName || "Ẩn danh"}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/default-avatar.png";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 text-sm">
                                {comment.userFullName || "Ẩn danh"}
                              </span>
                              <span className="text-xs text-gray-500">
                                • {formatTimeAgo(comment.createdDate)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed bg-white p-3 rounded-lg shadow-sm">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xl">💬</span>
                        </div>
                        <p className="text-sm font-medium mb-1">Chưa có bình luận nào</p>
                        <p className="text-xs">Hãy là người đầu tiên bình luận về bài viết này!</p>
                      </div>
                    )}

                    {/* Load More Comments */}
                    {visibleCount < comments.length && (
                      <div className="text-center">
                        <button
                          onClick={() => setVisibleCount((prev) => prev + 5)}
                          className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-medium text-sm transition-colors duration-200"
                        >
                          Xem thêm {comments.length - visibleCount} bình luận
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-600 rounded-full"></span>
                  BÀI VIẾT MỚI NHẤT
                </h2>
                
                {loadingNewest ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-20 h-16 bg-emerald-100 rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-emerald-100 rounded w-full"></div>
                            <div className="h-3 bg-emerald-100 rounded w-3/4"></div>
                            <div className="h-3 bg-emerald-100 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : newestPosts.length > 0 ? (
                  <div className="space-y-4">
                    {newestPosts.map((post) => (
                      <Link 
                        href={`/news/${post.newsId || post.newsID}`} 
                        key={post.newsId || post.newsID} 
                        className="group block"
                      >
                        <div className="flex gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-all duration-200">
                          <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={post.imagesLink || "/placeholder/80/64.jpg"}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder/80/64.jpg";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-emerald-600 transition-colors mb-1">
                              {post.header || post.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{post.userName}</span>
                              <span>•</span>
                              <span>{post.timeReading}p đọc</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">📰</span>
                    </div>
                    <p className="text-sm">Không có bài viết mới</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Posts */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-600 rounded-full"></span>
            Bài viết liên quan
          </h2>
          
          {loadingRelated ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-40 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : relatedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <Link href={`/news/${post.newsId || post.newsID}`} key={post.newsId || post.newsID} className="group">
                  <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={post.imagesLink || "/placeholder/400/250.jpg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder/400/250.jpg";
                        }}
                      />
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <img
                          src={post.userAvartar || post.avatar || "/placeholder/20/20.jpg"}
                          alt={post.userName}
                          className="w-5 h-5 rounded-full object-cover border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder/20/20.jpg";
                          }}
                        />
                        <span>{post.userName}</span>
                        <span>•</span>
                        <span>{post.timeReading}p đọc</span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {post.header || post.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                        {post.content?.slice(0, 100)}...
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📰</span>
              </div>
              <p className="text-sm">Không có bài viết liên quan</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}