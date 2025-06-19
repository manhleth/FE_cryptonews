"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import {
  Users, Edit3, Trash2, Save, X, Search, Filter, ChevronUp, ChevronDown,
  User, Mail, Phone, Calendar, Shield, MoreVertical
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type User = {
  id: number;
  username: string;
  email: string;
  fullname: string;
  phonenumber: string;
  birthday: string;
  avatar: string;
  role: string;
};

type SortField = 'id' | 'fullname' | 'email' | 'role';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("user");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isClient, setIsClient] = useState(false);
  
  const { toast } = useToast();
  const { token } = useAuth();

  // Ensure we're on client side before accessing localStorage
  useEffect(() => {
    setIsClient(true);
  }, []);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("tokenAdmin");
    }
    return null;
  };

  // Check if token is expired and handle refresh/redirect
  const handleTokenError = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("tokenAdmin");
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    if (!isClient) return;
    
    const valueToken = getToken();
    if (!valueToken) {
      setError("Token không tồn tại. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/User/GetAllUserByAdmin", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${valueToken}`,
        },
      });
      
      if (response.status === 401) {
        handleTokenError();
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Lỗi khi lấy danh sách người dùng: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.statusCode !== 1 || !result.data) throw new Error("Lỗi dữ liệu từ API");
      
      const mappedUsers: User[] = result.data.map((u: any) => ({
        id: u.userId,
        username: u.username || "",
        email: u.email || "",
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

  // Delete user
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    
    const valueToken = getToken();
    if (!valueToken) {
      setError("Token không tồn tại. Vui lòng đăng nhập lại.");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/User/DeleUserByAdmin?userID=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${valueToken}` },
      });
      
      if (response.status === 401) {
        handleTokenError();
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Lỗi khi xóa người dùng: ${response.status} ${response.statusText}`);
      }
      
      setUsers(users.filter((user) => user.id !== id));
      toast({ title: "Success", description: "User deleted successfully", duration: 3000 });
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive", duration: 3000 });
    }
  };

  // Update role
  const handleUpdateRole = async () => {
    if (!editingUser) return;

    const valueToken = getToken();
    if (!valueToken) {
      setError("Token không tồn tại. Vui lòng đăng nhập lại.");
      return;
    }

    const roleChange = newRole === "admin" ? 1 : 0;
    const url = `http://localhost:5000/api/User/SetAdminRole?UserID=${editingUser.id}&RoleChange=${roleChange}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${valueToken}`,
        },
      });

      if (response.status === 401) {
        handleTokenError();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.statusCode !== 1) throw new Error(result.data || "Cập nhật vai trò không thành công");

      toast({ title: "Success", description: "Role updated successfully", duration: 3000 });
      await fetchUsers();
      setEditingUser(null);
      setError("");
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive", duration: 3000 });
    }
  };

  // Handle sorting
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

  // Effects
  useEffect(() => {
    if (isClient) {
      fetchUsers();
    }
  }, [isClient]);

  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = [user.fullname, user.email, user.username]
        .some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, sortField, sortDirection]);

  // Helper functions
  const formatDate = (dateString: string) => 
    dateString ? new Date(dateString).toLocaleDateString('vi-VN') : "N/A";

  const getRoleBadgeClass = (role: string) =>
    role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200';

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-emerald-600"
    >
      <span>{children}</span>
      {getSortIcon(field)}
    </button>
  );

  // Don't render anything until we're on the client side
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left"><SortableHeader field="id">ID</SortableHeader></th>
                <th className="px-6 py-4 text-left"><SortableHeader field="fullname">Thông tin cá nhân</SortableHeader></th>
                <th className="px-6 py-4 text-left"><SortableHeader field="email">Email</SortableHeader></th>
                <th className="px-6 py-4 text-left">Liên hệ</th>
                <th className="px-6 py-4 text-left"><SortableHeader field="role">Vai trò</SortableHeader></th>
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
                    {editingUser?.id === user.id ? (
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
                    {editingUser?.id === user.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleUpdateRole}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Save className="w-3 h-3 mr-1" />Lưu
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <X className="w-3 h-3 mr-1" />Hủy
                        </button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-transparent border border-transparent rounded-lg hover:text-gray-500">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => { setEditingUser(user); setNewRole(user.role); }}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />Chỉnh sửa vai trò
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />Xóa tài khoản
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
                        {searchTerm || roleFilter !== "all" ? "Không tìm thấy người dùng phù hợp" : "Chưa có người dùng nào"}
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