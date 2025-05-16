"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { 
  Users, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  UserCheck, 
  UserX,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type SortField = 'id' | 'fullname' | 'email' | 'role';
type SortDirection = 'asc' | 'desc';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("user");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { token } = useAuth();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Lấy danh sách người dùng từ API khi component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, sortField, sortDirection]);

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
      toast({
        title: "Success",
        description: "User deleted successfully",
        duration: 3000
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
        duration: 3000
      });
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
        title: "Success",
        description: "Role updated successfully",
        duration: 3000
      });
      
      if (!response.ok || result.statusCode !== 1) {
        throw new Error(result.message || "Cập nhật vai trò không thành công");
      }
  
      // Làm mới danh sách người dùng và thoát khỏi chế độ chỉnh sửa
      fetchUsers();
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
      console.error("❌ Lỗi khi cập nhật vai trò:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
        duration: 3000
      });
    }
  };
  
  // Hàm hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getRoleBadgeClass = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
              <p className="text-gray-600">Quản lý người dùng và phân quyền hệ thống</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tổng số</p>
            <p className="text-2xl font-bold text-emerald-600">{users.length}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('id')}
                    className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
                  >
                    <span>ID</span>
                    {getSortIcon('id')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('fullname')}
                    className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
                  >
                    <span>Thông tin cá nhân</span>
                    {getSortIcon('fullname')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
                  >
                    <span>Email</span>
                    {getSortIcon('email')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">Liên hệ</th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
                  >
                    <span>Vai trò</span>
                    {getSortIcon('role')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">#{user.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.fullname} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.fullname || 'Chưa cập nhật'}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{user.phonenumber || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(user.birthday)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser && editingUser.id === user.id ? (
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser && editingUser.id === user.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleUpdateRole}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Lưu
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-transparent border border-transparent rounded-lg hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(user);
                              setNewRole(user.role);
                            }}
                            className="flex items-center space-x-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Chỉnh sửa vai trò</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.id)}
                            className="flex items-center space-x-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Xóa tài khoản</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center" colSpan={6}>
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">
                        {searchTerm || roleFilter !== "all" 
                          ? "Không tìm thấy người dùng phù hợp" 
                          : "Chưa có người dùng nào"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {filteredUsers.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Hiển thị {filteredUsers.length} / {users.length} người dùng
        </div>
      )}
    </div>
  );
}