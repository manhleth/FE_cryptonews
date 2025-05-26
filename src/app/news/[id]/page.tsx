// src/app/news/[id]/page.tsx
"use client"
import { notFound } from "next/navigation";
import { mockNews } from "@/data/mockData";
import { Share2, BookmarkIcon, Clock, User, Calendar } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import CommentSection from "@/components/Comments";

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
  const { token } = useAuth();
  const [item, setItem] = useState<NewsData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch news data
  useEffect(() => {
    if (!token) return;
    
    const fetchNewsData = async () => {
      try {
        setIsInitialLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/News/GetNewsByIdAsync?id=${id}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data.data);
        setItem(data.data);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchNewsData();
  }, [token, id]);

  // Fetch saved status
  useEffect(() => {
    if (!token) return;

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
  }, [token, id]);

  // Fetch comments
  useEffect(() => {
    if (!token) return;

    const fetchComments = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/Comment/GetListCommentByNews?newsID=${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
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
  }, [token, id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/Comments/AddComment`,
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

    if (!token) return;

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

  // No token state
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center py-12 px-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Đăng nhập để tiếp tục
          </h2>
          <p className="text-gray-600">
            Vui lòng đăng nhập để xem chi tiết bài viết
          </p>
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
                {item.title}
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
              <CommentSection newsId={Number(id)} />
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {mockNews.slice(0, 4).map((related) => (
                <div key={related.id} className="group cursor-pointer">
                  <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={related.image}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <img
                          src="/api/placeholder/20/20"
                          alt={related.author}
                          className="w-5 h-5 rounded-full"
                        />
                        <span>{related.author}</span>
                        <span>•</span>
                        <span>{related.timeAgo}</span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {related.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {related.excerpt}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}