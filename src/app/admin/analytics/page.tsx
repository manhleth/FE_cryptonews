"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  MessageCircle,
  Eye,
  Activity,
  Calendar,
  Clock,
  Star,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalNews: number;
  totalComments: number;
  totalPageViews: number;
  dailyStats: DailyStats[];
  recentActivities: UserActivity[];
  popularNews: PopularNews[];
}

interface DailyStats {
  date: string;
  totalPageViews: number;
  uniqueVisitors: number;
  newUsers: number;
  newPosts: number;
  newComments: number;
}

interface UserActivity {
  userActivityId: number;
  userId: number;
  activityType: string;
  relatedNewsId?: number;
  activityDate: string;
  timeAgo: string;
}

interface PopularNews {
  newsId: number;
  title: string;
  header: string;
  imagesLink: string;
  viewCount: number;
  commentCount: number;
  saveCount: number;
  authorName: string;
  createdDate: string;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem("tokenAdmin") : null;

  useEffect(() => {
    if (adminToken) {
      fetchDashboardStats();
    }
  }, [adminToken, selectedPeriod]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/Analytics/GetDashboardStats?days=${selectedPeriod}`, {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tải thống kê");
      }

      const result = await response.json();
      if (result.statusCode === 1 && result.data) {
        setStats(result.data);
      } else {
        throw new Error("Dữ liệu không hợp lệ");
      }
    } catch (err: any) {
      console.error("Error loading analytics:", err);
      setError(err.message || "Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'LOGIN': return <Users className="w-4 h-4 text-green-600" />;
      case 'VIEW_NEWS': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'COMMENT': return <MessageCircle className="w-4 h-4 text-purple-600" />;
      case 'SAVE_POST': return <Star className="w-4 h-4 text-yellow-600" />;
      case 'REGISTER': return <Users className="w-4 h-4 text-emerald-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityLabel = (activityType: string) => {
    switch (activityType) {
      case 'LOGIN': return 'Đăng nhập';
      case 'VIEW_NEWS': return 'Xem bài viết';
      case 'COMMENT': return 'Bình luận';
      case 'SAVE_POST': return 'Lưu bài viết';
      case 'REGISTER': return 'Đăng ký';
      default: return activityType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600">Đang tải thống kê...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Không có dữ liệu thống kê</p>
      </div>
    );
  }

  // Calculate growth (simplified - compare last 7 days vs previous 7 days)
  const recentStats = stats.dailyStats.slice(-7);
  const previousStats = stats.dailyStats.slice(-14, -7);
  
  const recentViews = recentStats.reduce((sum, day) => sum + day.totalPageViews, 0);
  const previousViews = previousStats.reduce((sum, day) => sum + day.totalPageViews, 0);
  const viewsGrowth = previousViews > 0 ? ((recentViews - previousViews) / previousViews) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thống kê & Phân tích</h1>
              <p className="text-gray-600">Tổng quan hoạt động và hiệu suất website</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Thời gian:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 ngày qua</option>
              <option value={30}>30 ngày qua</option>
              <option value={90}>90 ngày qua</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng người dùng</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng bài viết</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.totalNews.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lượt xem</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalPageViews.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {viewsGrowth >= 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${viewsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(viewsGrowth).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bình luận</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalComments.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Stats Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Hoạt động theo ngày
          </h3>
          <div className="space-y-4">
            {stats.dailyStats.slice(-7).map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{day.totalPageViews}</p>
                    <p className="text-xs text-gray-500">lượt xem</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{day.uniqueVisitors}</p>
                    <p className="text-xs text-gray-500">người dùng</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            Hoạt động gần đây
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.recentActivities.slice(0, 10).map((activity) => (
              <div key={activity.userActivityId} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.activityType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    User #{activity.userId} - {getActivityLabel(activity.activityType)}
                  </p>
                  <p className="text-xs text-gray-500">{activity.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-600" />
          Bài viết phổ biến
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.popularNews.slice(0, 6).map((news) => (
            <div key={news.newsId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <img
                  src={news.imagesLink || "/placeholder/60/60"}
                  alt={news.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {news.header || news.title}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">Bởi {news.authorName}</p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {news.viewCount}
                    </span>
                    <span className="flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {news.commentCount}
                    </span>
                    <span className="flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      {news.saveCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Statistics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Thống kê chi tiết theo ngày
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lượt xem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng duy nhất
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng mới
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bài viết mới
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bình luận mới
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.dailyStats.slice(-10).reverse().map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {day.totalPageViews.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        {day.uniqueVisitors.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        {day.newUsers.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-emerald-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        {day.newPosts.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 text-orange-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        {day.newComments.toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Tăng trưởng</h4>
            <p className="text-sm text-gray-600">
              Lượt xem tăng {Math.abs(viewsGrowth).toFixed(1)}% so với kỳ trước
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Hoạt động</h4>
            <p className="text-sm text-gray-600">
              {stats.recentActivities.length} hoạt động gần đây
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Nội dung</h4>
            <p className="text-sm text-gray-600">
              {stats.popularNews.length} bài viết phổ biến
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}