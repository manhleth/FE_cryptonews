"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  LogIn
} from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const {login} = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Xoá lỗi cũ
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/User/UserLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      login(data.data.tokenGen, data.data.user);
      console.log(data.data.user);
      
      if (data.data.user.roleId === 1) {
        // Nếu là admin (roleId = 1) thì chuyển hướng sang trang quản trị
        localStorage.setItem("tokenAdmin", data.data.tokenGen);
        console.log("Token trong admin mới login: " + localStorage.getItem("tokenAdmin"));
        
        // Hiển thị thông báo thành công trước khi chuyển hướng
        setTimeout(() => {
          router.push("/admin/accounts");
        }, 1000);
      } else {
        // Nếu không phải admin thì đăng xuất và báo lỗi
        setError("Bạn không có quyền truy cập vào trang quản trị");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-100 opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-100 opacity-20"></div>
      </div>

      <div className="relative bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h2>
          <p className="text-gray-600">Đăng nhập để truy cập trang quản trị</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success message when redirecting */}
        {loading && email && password && !error && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-600 text-sm">Đăng nhập thành công! Đang chuyển hướng...</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Đang đăng nhập...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <LogIn className="w-5 h-5" />
                <span>Đăng nhập</span>
              </div>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Chỉ dành cho quản trị viên hệ thống
          </p>
        </div>
      </div>
    </div>
  );
}