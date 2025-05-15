"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const [newRole, setNewRole] = useState<string>("user");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const {toast} = useToast();
  const { token } = useAuth();

  // State cho thêm tài khoản mới

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

  // Hàm cập nhật vai trò người dùng qua API sử dụng endpoint SetAdminRole hoặc SetUserRole
  const handleUpdateRole = async () => {
    if (!editingUser) return;
  
    const roleChange = newRole === "admin" ? 1 : 0;
    const url = `http://localhost:5000/api/User/SetAdminRole?UserID=${editingUser.id}&RoleChange=${roleChange}`
  
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ UserID: editingUser.id }),
      });
  
      const result = await response.json();
      console.log("✅ API Response:", result);
      toast({
        title: "Update role success",
        duration: 3000
      })
      if (!response.ok || result.statusCode !== 1) {
        throw new Error(result.message || "Cập nhật vai trò không thành công");
      }
  
      // Làm mới danh sách người dùng và thoát khỏi chế độ chỉnh sửa
      fetchUsers();
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
      console.error("❌ Lỗi khi cập nhật vai trò:", err);
    }
  };
  
  // Hàm hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Bảo trì tài khoản</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

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
              <td className="border p-2 text-center">
                {editingUser && editingUser.id === user.id ? (
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="border p-1"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td className="border p-2 text-center">
                {editingUser && editingUser.id === user.id ? (
                  <>
                    <button
                      onClick={handleUpdateRole}
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 ml-2"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setNewRole(user.role); // Gán giá trị hiện tại của user
                      }}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2"
                    >
                      Xoá
                    </button>
                  </>
                )}
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
