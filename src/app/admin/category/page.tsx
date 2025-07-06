"use client";

import { useEffect, useState } from "react";
import { FolderTree, Plus, Trash2, Folder, FolderOpen } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [childrenCategories, setChildrenCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newChildCategory, setNewChildCategory] = useState({
    childrenCategoryName: "",
    parentCategoryId: 0,
    description: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get token from localStorage
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("tokenAdmin"));
    }
  }, []);

  // Fetch Categories
  const fetchCategories = async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:5000/api/Category/GetAllCategories", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.statusCode === 1) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch Children Categories
  const fetchChildrenCategories = async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:5000/api/ChildrenCategory/GetListChildrenCategory", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.statusCode === 1) {
        setChildrenCategories(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching children categories:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchChildrenCategories();
    }
  }, [token]);

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/Category/CreateCategory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryName: newCategoryName }),
      });
      
      const result = await response.json();
      if (result.statusCode === 1) {
        setMessage("Tạo danh mục thành công!");
        setNewCategoryName("");
        fetchCategories();
      } else {
        setMessage("Lỗi: " + result.data);
      }
    } catch (error) {
      setMessage("Lỗi kết nối");
    }
    setIsLoading(false);
  };

  // Delete Category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Xóa danh mục này?")) return;

    try {
      console.log("Deleting category with ID:", id); // Debug log
      
      // ✅ FIX: Use correct endpoint from your API test
      const response = await fetch(`http://localhost:5000/api/Category/DeleteCategory?categoryID=${id}`, {
        method: "DELETE", // ✅ FIX: Use DELETE method instead of POST
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log("Delete response status:", response.status); // Debug log
      
      // Try to parse response, but handle empty responses
      let result = null;
      const responseText = await response.text();
      console.log("Delete response text:", responseText); // Debug log
      
      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText);
          console.log("Delete response JSON:", result); // Debug log
        } catch (parseError) {
          console.log("Could not parse JSON, treating as success");
        }
      }
      
      if (response.ok) {
        setMessage("Xóa danh mục thành công!");
        fetchCategories();
        fetchChildrenCategories();
      } else {
        setMessage(`Lỗi khi xóa danh mục: ${response.status} - ${result?.data || responseText}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Lỗi kết nối: " + error);
    }
  };

  // Create Children Category
  const handleCreateChildCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildCategory.childrenCategoryName.trim() || !newChildCategory.parentCategoryId) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/ChildrenCategory/CreateChildrenCategory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          childrenCategoryName: newChildCategory.childrenCategoryName,
          parentCategoryId: newChildCategory.parentCategoryId,
          description: newChildCategory.description,
          childrenCategoryId: 0,
        }),
      });
      
      const result = await response.json();
      if (result.statusCode === 1) {
        setMessage("Tạo danh mục con thành công!");
        setNewChildCategory({ childrenCategoryName: "", parentCategoryId: 0, description: "" });
        fetchChildrenCategories();
      } else {
        setMessage("Lỗi: " + result.data);
      }
    } catch (error) {
      setMessage("Lỗi kết nối");
    }
    setIsLoading(false);
  };

  // Delete Children Category
  const handleDeleteChildCategory = async (id: number) => {
    if (!confirm("Xóa danh mục con này?")) return;

    try {
      console.log("Deleting child category with ID:", id); // Debug log
      
      // ✅ FIX: Use correct endpoint (need to check what the actual endpoint is)
      const response = await fetch(`http://localhost:5000/api/ChildrenCategory/DeleteChildrenCategory?id=${id}`, {
        method: "DELETE", // ✅ FIX: Use DELETE method
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log("Delete child response status:", response.status); // Debug log
      
      // Try to parse response, but handle empty responses
      let result = null;
      const responseText = await response.text();
      console.log("Delete child response text:", responseText); // Debug log
      
      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText);
          console.log("Delete child response JSON:", result); // Debug log
        } catch (parseError) {
          console.log("Could not parse JSON, treating as success");
        }
      }
      
      if (response.ok) {
        setMessage("Xóa danh mục con thành công!");
        fetchChildrenCategories();
      } else {
        setMessage(`Lỗi khi xóa danh mục con: ${response.status} - ${result?.data || responseText}`);
      }
    } catch (error) {
      console.error("Delete child error:", error);
      setMessage("Lỗi kết nối: " + error);
    }
  };

  if (!token) {
    return <div className="p-4">Vui lòng đăng nhập</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold flex items-center">
          <FolderTree className="w-6 h-6 mr-2" />
          Quản lý danh mục
        </h1>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          {message}
        </div>
      )}

      {/* Create Category */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Folder className="w-5 h-5 mr-2" />
          Thêm danh mục cha
        </h2>
        <form onSubmit={handleCreateCategory} className="flex gap-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Tên danh mục"
            className="flex-1 px-3 py-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Danh sách danh mục cha</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Tên danh mục</th>
                <th className="px-4 py-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category.categoryId || index} className="border-b">
                  <td className="px-4 py-3">{category.categoryId}</td>
                  <td className="px-4 py-3">{category.categoryName}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteCategory(category.categoryId)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Children Category */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FolderOpen className="w-5 h-5 mr-2" />
          Thêm danh mục con
        </h2>
        <form onSubmit={handleCreateChildCategory} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={newChildCategory.childrenCategoryName}
              onChange={(e) => setNewChildCategory({
                ...newChildCategory,
                childrenCategoryName: e.target.value
              })}
              placeholder="Tên danh mục con"
              className="flex-1 px-3 py-2 border rounded"
              required
            />
            <select
              value={newChildCategory.parentCategoryId}
              onChange={(e) => setNewChildCategory({
                ...newChildCategory,
                parentCategoryId: Number(e.target.value)
              })}
              className="px-3 py-2 border rounded"
              required
            >
              <option value={0}>Chọn danh mục cha</option>
              {categories.map((cat, index) => (
                <option key={cat.categoryId || index} value={cat.categoryId}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Children Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Danh sách danh mục con</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Tên danh mục con</th>
                <th className="px-4 py-3 text-left">Danh mục cha</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {childrenCategories.map((child, index) => {
                const childId = child.childrenCategoryId || child.childrenCategoryID || child.id;
                const parentCategory = categories.find(cat => cat.categoryId === child.parentCategoryId);
                
                return (
                  <tr key={childId || index} className="border-b">
                    <td className="px-4 py-3">{childId}</td>
                    <td className="px-4 py-3">{child.childrenCategoryName}</td>
                    <td className="px-4 py-3">{parentCategory?.categoryName || "N/A"}</td>
                    <td className="px-4 py-3">{child.description || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteChildCategory(childId)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-600">Tổng danh mục cha</p>
          <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-600">Tổng danh mục con</p>
          <p className="text-2xl font-bold text-green-600">{childrenCategories.length}</p>
        </div>
      </div>
    </div>
  );
}