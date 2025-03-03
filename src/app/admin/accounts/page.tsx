"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

// Định nghĩa kiểu dữ liệu người dùng theo API
type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  fullname: string;
  phonenumber: string;
  birthday: string; // YYYY-MM-DD
  avatar: string;
  role: string; // "admin" hoặc "user"
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const {token} = useAuth();
  // State cho thêm tài khoản mới
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    fullname: "",
    phonenumber: "",
    birthday: "",
    avatar: "",
    role: "user",
  });

  // Hard-code token từ API (nên thay bằng cách quản lý token hợp lý)
  
  // Lấy danh sách người dùng từ API khi component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Hàm gọi API GET để lấy danh sách user
  const fetchUsers = async () => {
    const valueToken = localStorage.getItem("tokenAdmin");
    console.log("Token trong accounts: " + valueToken);
    try {
      const response = await fetch("http://localhost:5000/api/User/GetAllUserByAdmin", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách người dùng");
      }
      const result = await response.json();
      if (result.statusCode !== 1 || !result.data) {
        throw new Error("Lỗi dữ liệu từ API");
      }
      // Ánh xạ dữ liệu từ API sang kiểu FE, xử lý giá trị null
      const mappedUsers: User[] = result.data.map((u: any) => ({
        id: u.userId,
        username: u.username || "",
        email: u.email || "",
        password: u.password || "",
        fullname: u.fullname || "",
        phonenumber: u.phonenumber || "",
        birthday: u.birthday ? u.birthday.split("T")[0] : "",
        avatar: u.avatar || "",
        role: u.roleId === 1 ? "admin" : "user",
      }));
      setUsers(mappedUsers);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Hàm thêm tài khoản mới qua API POST
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // Chuẩn bị payload cho API
    const payload = {
      username: newUser.username,
      password: newUser.password,
      email: newUser.email,
      fullname: newUser.fullname,
      phonenumber: newUser.phonenumber,
      birthday: newUser.birthday, // Định dạng YYYY-MM-DD
      avatar: newUser.avatar,
    };
    try {
      const response = await fetch("http://localhost:5000/api/User/UserRegister", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Lỗi khi thêm người dùng");
      }
      const result = await response.json();
      if (result.statusCode !== 1) {
        throw new Error("Thêm người dùng không thành công");
      }
      // Cập nhật lại danh sách người dùng
      fetchUsers();
      // Reset form thêm tài khoản
      setNewUser({
        username: "",
        email: "",
        password: "",
        fullname: "",
        phonenumber: "",
        birthday: "",
        avatar: "",
        role: "user",
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Hàm xóa user qua API DELETE (sử dụng query parameter userID)
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/User/DeleUserByAdmin?userID=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi xóa người dùng");
      }
      // Cập nhật lại danh sách sau khi xóa thành công
      setUsers(users.filter((user) => user.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Khi chọn chỉnh sửa user
  

  // Hàm cập nhật user qua API POST
 

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Quản lý người dùng</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Form thêm tài khoản mới */}
      

      {/* Danh sách người dùng */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Họ và tên</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">SĐT</th>
            <th className="border p-2">Ngày sinh</th>
            <th className="border p-2">Avatar</th>
            <th className="border p-2">Vai trò</th>
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border p-2 text-center">{user.id}</td>
              <td className="border p-2">{user.fullname}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2 text-center">{user.phonenumber}</td>
              <td className="border p-2 text-center">{user.birthday}</td>
              <td className="border p-2 text-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full mx-auto" />
                ) : (
                  "Chưa có"
                )}
              </td>
              <td className="border p-2 text-center">{user.role}</td>
              <td className="border p-2 text-center">
                
                <button
                  onClick={() => handleDelete(user.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2"
                >
                  Xoá
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td className="border p-2 text-center" colSpan={8}>
                Không có người dùng.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
