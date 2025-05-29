// src/app/news/[id]/page.tsx
"use client"
import { notFound } from "next/navigation";
import { Share2, BookmarkIcon, Clock, User, Calendar } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import CommentSection from "@/components/Comments";
import Link from "next/link";

interface NewsDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

interface NewsData {
  header: string;
  title: string;
  content: string;
  footer: string;
  timeReading: number;
  userName: string;
  avatar: string;
  categoryId: number;
  imagesLink: string;
  newsID: number;
}

interface Comment {
  commentId: number;
  userFullName: string;
  userAvartar: string;
  content: string;
  createdAt: string;
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { id } = resolvedParams;
  const { token, user } = useAuth();
  
  // States
  const [item, setItem] = useState<NewsData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State cho bài viết liên quan
  const [relatedPosts, setRelatedPosts] = useState<NewsData[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Debug logs
  console.log("NewsDetailPage mounted");
  console.log("ID from params:", id);
  console.log("Token:", token ? "exists" : "missing");

  // Fetch news data
  useEffect(() => {
    console.log("useEffect triggered - token:", !!token, "id:", id);
    
    const fetchNewsData = async () => {
      try {
        console.log("Fetching news data for ID:", id);
        setIsInitialLoading(true);
        setError(null);
        
        // Không bắt buộc token để lấy dữ liệu bài viết
        const response = await fetch(
          `http://localhost:5000/api/News/GetNewsByIdAsync?id=${id}`
        );

        console.log("API Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response data:", data);
        
        if (data && data.statusCode === 1 && data.data) {
          setItem(data.data);
          console.log("News item set successfully");
        } else {
          console.error("Invalid API response structure or no data");
          setError("Không tìm thấy bài viết");
        }
      } catch (error: any) {
        console.error("Error fetching news:", error);
        setError(error.message || "Có lỗi xảy ra khi tải bài viết");
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchNewsData();
  }, [id]);

  // Fetch bài viết liên quan khi có thông tin về categoryId
  useEffect(() => {
    if (!item || !item.categoryId) return;

    const fetchRelatedPosts = async () => {
      try {
        setLoadingRelated(true);
        // Sử dụng API GetNewsByCategoryTop để lấy bài viết mới nhất trong cùng danh mục
        const response = await fetch(
          `http://localhost:5000/api/News/GetNewsByCategoryTop?category=${item.categoryId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.statusCode === 1 && data.data) {
          // Lọc ra các bài viết khác với bài viết hiện tại và chỉ lấy 3 bài
          const filteredPosts = data.data
            .filter((post: NewsData) => post.newsID != Number(id))
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

  // Fetch saved status - chỉ khi đã đăng nhập
  useEffect(() => {
    if (!token || !item) return;

    const fetchSavedNews = async () => {
      try {
        const response = await fetch(
          'http://localhost:5000/api/Saved/GetYourListSaved',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.data) {
          console.log("Danh sách từ detail: ", data);
          const savedNewsIds = data.data.map((saved: any) => saved.newsId);
          console.log("Danh sách saved ids: ", savedNewsIds);
          
          const isCurrentNewsSaved = savedNewsIds.includes(Number(id));
          setIsSaved(isCurrentNewsSaved);
          console.log("Is saved:", isCurrentNewsSaved);
        }
      } catch (error) {
        console.error("Error fetching saved news:", error);
      }
    };

    fetchSavedNews();
  }, [token, id, item]);

  // Fetch comments - không cần token để xem comments
  useEffect(() => {
    if (!item) return;

    const fetchComments = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/Comment/GetListCommentByNews?newsID=${id}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setComments(data.data || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [id, item]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/Comment/CreateNewComment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newsId: id,
            content: newComment,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setComments((prev) => [data.data, ...prev]);
      setNewComment("");
      setVisibleCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      // Hiển thị thông báo khi người dùng chưa đăng nhập
      alert("Vui lòng đăng nhập để lưu bài viết này");
      return;
    }

    try {
      setLoading(true);
      console.log("Gửi lưu bài viết: " + id);
      
      const response = await fetch(
        `http://localhost:5000/api/Saved/AddOrRemoveSaved?newsID=${id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setIsSaved(prev => !prev);
      } else {
        console.error("Failed to toggle bookmark");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      // You can replace this with a toast notification
      alert("Đã sao chép liên kết bài viết!");
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // Loading state with skeleton
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Có lỗi xảy ra
          </h2>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Không tìm thấy bài viết
          </h2>
          <p className="text-gray-600">
            Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-100">
          {/* Hero Image */}
          <div className="aspect-video relative overflow-hidden">
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

              {/* Author Info */}
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={item.avatar || "/placeholder/48/48.jpg"} 
                  alt={item.userName} 
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md" 
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
                      <span>Hôm nay</span>
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
                  <BookmarkIcon
                    className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`}
                  />
                  {isSaved ? 'Đã lưu' : 'Lưu bài'}
                </button>
              </div>
            </header>

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <div className="text-gray-700 leading-relaxed text-lg">
                {item.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-emerald-100 pt-8">
              <h2 className="text-lg font-semibold mb-4">Bình luận</h2>

              {/* Khung scrollable cho danh sách comment */}
              <div className="border rounded-md p-3 max-h-96 overflow-y-auto space-y-4">
                {comments.length > 0 ? (
                  comments.slice(0, visibleCount).map((comment, index) => (
                    <div key={comment.commentId || index} className="flex items-start gap-2">
                      {/* Ảnh avatar */}
                      <div className="h-8 w-8 rounded-full overflow-hidden">
                        <img
                          src={comment.userAvartar || "/default-avatar.png"}
                          alt={comment.userFullName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {/* Khối nội dung comment */}
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-xl p-3">
                          <div className="font-semibold text-sm">{comment.userFullName}</div>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Chưa có bình luận nào cho bài viết này
                  </div>
                )}

                {/* Nút Xem thêm nếu còn comment ẩn */}
                {visibleCount < comments.length && (
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    className="block mx-auto mt-2 text-blue-600 text-sm hover:underline"
                  >
                    Xem thêm {comments.length - visibleCount} bình luận
                  </button>
                )}
              </div>

              {/* Form nhập comment - chỉ hiển thị khi đã đăng nhập */}
              {token ? (
                <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-4">
                  <div className="h-8 w-8 rounded-full overflow-hidden">
                    <img
                      src={user?.avatar || "/default-avatar.png"}
                      alt={user?.fullname}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      className="w-full p-2 border rounded-full focus:outline-none"
                      placeholder="Viết bình luận..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  >
                    Gửi
                  </button>
                </form>
              ) : (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">
                    <Link href="/User/Login" className="text-blue-600 hover:underline">
                      Đăng nhập
                    </Link>{" "}
                    để bình luận về bài viết này
                  </p>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Related Posts */}
        <section className="mt-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-emerald-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-600 rounded-full"></span>
              Bài viết liên quan
            </h2>
            
            {loadingRelated ? (
              // Loading state for related posts
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
                  <Link href={`/news/${post.newsID}`} key={post.newsID} className="group">
                    <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 h-full flex flex-col">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={post.imagesLink || "/placeholder/400/250.jpg"}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <img
                            src={post.avatar || "/placeholder/20/20"}
                            alt={post.userName}
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{post.userName}</span>
                          <span>•</span>
                          <span>{post.timeReading} phút đọc</span>
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
                Không có bài viết liên quan
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}