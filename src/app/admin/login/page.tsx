"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Lấy các hàm cần thiết từ context

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Xoá lỗi cũ

    try {
      const response = await fetch("http://localhost:5000/api/User/UserLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then((data) => data.json()).then((data) => {
        console.log(data.data.user);
        if (data.data.user.roleId === 1) {
          // Nếu là admin (roleId = 1) thì chuyển hướng sang trang quản trị
          localStorage.setItem("tokenAdmin", data.data.tokenGen);
          console.log("Token trong admin mới login: " + localStorage.getItem("tokenAdmin"));
          router.push("/admin/accounts");
        } else {
          // Nếu không phải admin thì đăng xuất và báo lỗi
          setError("Bạn không có quyền admin");
        }
      });
    } catch (err: any) {
      setError(err.message || "Lỗi đăng nhập");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Login</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Nhập email"
            />
          </div>

          <div>
            <label className="block text-gray-700">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
