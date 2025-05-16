"use client";

import { useEffect, useState } from "react";
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Folder,
  FolderOpen,
  Search,
  Check,
  AlertCircle
} from "lucide-react";

type Category = {
  id: number;
  categoryName: string;
  description: string;
};

type ChildrenCategory = {
  id: number;
  name: string;
  parentCategoryId: number;
  description: string;
};

export default function CategoriesPage() {
  // State cho danh mục cha
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // State cho danh mục con
  const [childrenCategories, setChildrenCategories] = useState<ChildrenCategory[]>([]);
  const [selectedChildCategories, setSelectedChildCategories] = useState<number[]>([]);
  const [newChildCategory, setNewChildCategory] = useState({
    name: "",
    parentCategoryId: 0,
    description: "",
  });
  const [isCreatingChild, setIsCreatingChild] = useState(false);

  // Search states
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [childSearchTerm, setChildSearchTerm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const valueToken = localStorage.getItem("tokenAdmin");

  // Lấy danh mục từ API khi component mount
  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Category/GetAllCategories", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) throw new Error("Lỗi khi lấy danh mục");
      const result = await response.json();
      if (result.statusCode !== 1 || !result.data) throw new Error("Lỗi dữ liệu từ API");

      const mappedCategories: Category[] = result.data.map((item: any) => ({
        id: item.categoryId,
        categoryName: item.categoryName || "",
        description: item.description || "",
      }));
      setCategories(mappedCategories);
      setSelectedCategories([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Lấy danh sách danh mục con từ API
  const fetchChildrenCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/ChildrenCategory/GetListChildrenCategory", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) throw new Error("Lỗi khi lấy danh mục con");
      const result = await response.json();
      if (!result.data) throw new Error("Lỗi dữ liệu từ API");

      const mappedChildren: ChildrenCategory[] = result.data.map((item: any) => ({
        id: item.childrenCategoryID,
        name: item.childrenCategoryName || "",
        parentCategoryId: item.parentCategoryId,
        description: item.description || "",
      }));
      setChildrenCategories(mappedChildren);
      setSelectedChildCategories([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchChildrenCategories();
  }, []);

  // Clear messages after a few seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Filter functions
  const filteredCategories = categories.filter(category =>
    category.categoryName.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const filteredChildrenCategories = childrenCategories.filter(child => {
    const parentCategory = categories.find(cat => cat.id === child.parentCategoryId);
    return child.name.toLowerCase().includes(childSearchTerm.toLowerCase()) ||
           parentCategory?.categoryName.toLowerCase().includes(childSearchTerm.toLowerCase());
  });

  // ======== Phần Danh Mục Cha ========

  // Thêm danh mục cha mới
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }
    try {
      setIsCreating(true);
      const response = await fetch("http://localhost:5000/api/Category/CreateCategory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${valueToken}`,
        },
        body: JSON.stringify({ 
          categoryName: newCategoryName,
          description: newCategoryDescription 
        }),
      });
      const result = await response.json();
      if (!response.ok || result.statusCode !== 1) {
        throw new Error(result.message || "Lỗi khi tạo danh mục");
      }
      setNewCategoryName("");
      setNewCategoryDescription("");
      setSuccess("Danh mục đã được tạo thành công!");
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Xóa danh mục cha (đơn lẻ)
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await fetch(`http://localhost:5000/api/Category/AdminDelete?id=${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${valueToken}` },
      });
      setSuccess("Danh mục đã được xóa thành công!");
      fetchCategories();
      fetchChildrenCategories(); // Refresh children in case they were deleted
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Xóa nhiều danh mục cha đã chọn
  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.length === 0) {
      setError("Vui lòng chọn ít nhất một danh mục để xóa.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa những danh mục đã chọn?")) return;
    try {
      await Promise.all(
        selectedCategories.map((id) =>
          fetch(`http://localhost:5000/api/Category/AdminDelete?id=${id}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${valueToken}` },
          })
        )
      );
      setSuccess(`Đã xóa ${selectedCategories.length} danh mục thành công!`);
      fetchCategories();
      fetchChildrenCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Chỉnh sửa danh mục cha
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    try {
      // Note: You'll need to implement the update API endpoint
      // For now, we'll just update locally
      setCategories(
        categories.map((c) => (c.id === editingCategory.id ? editingCategory : c))
      );
      setEditingCategory(null);
      setSuccess("Danh mục đã được cập nhật thành công!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectCategory = (id: number, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleSelectAllCategories = (checked: boolean) => {
    setSelectedCategories(checked ? filteredCategories.map((c) => c.id) : []);
  };

  const allCategoriesSelected =
    filteredCategories.length > 0 && selectedCategories.length === filteredCategories.length;

  // ======== Phần Danh Mục Con ========

  // Thêm danh mục con mới
  const handleCreateChildCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildCategory.name.trim()) {
      setError("Vui lòng nhập tên danh mục con");
      return;
    }
    if (!newChildCategory.parentCategoryId) {
      setError("Vui lòng chọn danh mục cha");
      return;
    }
    try {
      setIsCreatingChild(true);
      const response = await fetch("http://localhost:5000/api/ChildrenCategory/CreateChildrenCategory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${valueToken}`,
        },
        body: JSON.stringify({
          childrenCategoryName: newChildCategory.name,
          parentCategoryId: newChildCategory.parentCategoryId,
          description: newChildCategory.description,
          childrenCategoryID: 0,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.statusCode !== 1) {
        throw new Error(result.message || "Lỗi khi tạo danh mục con");
      }
      // Reset form và load lại danh sách danh mục con
      setNewChildCategory({ name: "", parentCategoryId: 0, description: "" });
      setSuccess("Danh mục con đã được tạo thành công!");
      fetchChildrenCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreatingChild(false);
    }
  };

  // Xóa danh mục con đơn lẻ
  const handleDeleteChildCategory = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục con này?")) return;
    try {
      await fetch(`http://localhost:5000/api/ChildrenCategory/AdminDelete?id=${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${valueToken}` },
      });
      setSuccess("Danh mục con đã được xóa thành công!");
      fetchChildrenCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Xóa nhiều danh mục con đã chọn
  const handleBulkDeleteChildCategories = async () => {
    if (selectedChildCategories.length === 0) {
      setError("Vui lòng chọn ít nhất một danh mục con để xóa.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa những danh mục con đã chọn?")) return;
    try {
      await Promise.all(
        selectedChildCategories.map((id) =>
          fetch(`http://localhost:5000/api/ChildrenCategory/AdminDelete?id=${id}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${valueToken}` },
          })
        )
      );
      setSuccess(`Đã xóa ${selectedChildCategories.length} danh mục con thành công!`);
      fetchChildrenCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectChildCategory = (id: number, checked: boolean) => {
    setSelectedChildCategories((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleSelectAllChildCategories = (checked: boolean) => {
    setSelectedChildCategories(checked ? filteredChildrenCategories.map((c) => c.id) : []);
  };

  const allChildCategoriesSelected =
    filteredChildrenCategories.length > 0 &&
    selectedChildCategories.length === filteredChildrenCategories.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FolderTree className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
              <p className="text-gray-600">Tổ chức và quản lý danh mục bài viết</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Danh mục cha</p>
            <p className="text-2xl font-bold text-emerald-600">{categories.length}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* ===== Phần Danh Mục Cha ===== */}
      <section className="space-y-6">
        {/* Category Creation Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-emerald-600" />
            Thêm danh mục cha mới
          </h2>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  id="categoryName"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập tên danh mục"
                />
              </div>
              <div>
                <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <input
                  id="categoryDescription"
                  type="text"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nhập mô tả danh mục"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isCreating ? "Đang tạo..." : "Thêm danh mục"}
            </button>
          </form>
        </div>

        {/* Category List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách danh mục cha</h2>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm danh mục..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={handleBulkDeleteCategories}
                  disabled={selectedCategories.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa đã chọn ({selectedCategories.length})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={allCategoriesSelected}
                      onChange={(e) => handleSelectAllCategories(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => handleSelectCategory(category.id, e.target.checked)}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{category.id}
                    </td>
                    <td className="px-6 py-4">
                      {editingCategory && editingCategory.id === category.id ? (
                        <input
                          type="text"
                          value={editingCategory.categoryName}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, categoryName: e.target.value })
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <div className="flex items-center">
                          <Folder className="w-4 h-4 text-emerald-600 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{category.categoryName}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCategory && editingCategory.id === category.id ? (
                        <textarea
                          value={editingCategory.description}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, description: e.target.value })
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          rows={2}
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{category.description || "Chưa có mô tả"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingCategory && editingCategory.id === category.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleUpdateCategory}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-emerald-600 bg-emerald-100 hover:bg-emerald-200"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-600 bg-red-100 hover:bg-red-200"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Xoá
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <div className="flex flex-col items-center space-y-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <Folder className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">
                          {categorySearchTerm ? "Không tìm thấy danh mục phù hợp" : "Chưa có danh mục nào"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== Phần Danh Mục Con ===== */}
      <section className="space-y-6">
        {/* Children Category Creation Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FolderOpen className="w-5 h-5 mr-2 text-blue-600" />
            Thêm danh mục con mới
          </h2>
          <form onSubmit={handleCreateChildCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="childCategoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên danh mục con <span className="text-red-500">*</span>
                </label>
                <input
                  id="childCategoryName"
                  type="text"
                  value={newChildCategory.name}
                  onChange={(e) => setNewChildCategory({ ...newChildCategory, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên danh mục con"
                />
              </div>
              <div>
                <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục cha <span className="text-red-500">*</span>
                </label>
                <select
                  id="parentCategory"
                  value={newChildCategory.parentCategoryId}
                  onChange={(e) =>
                    setNewChildCategory({ ...newChildCategory, parentCategoryId: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>-- Chọn danh mục cha --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="childCategoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <input
                  id="childCategoryDescription"
                  type="text"
                  value={newChildCategory.description}
                  onChange={(e) =>
                    setNewChildCategory({ ...newChildCategory, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập mô tả"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isCreatingChild}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingChild ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isCreatingChild ? "Đang tạo..." : "Thêm danh mục con"}
            </button>
          </form>
        </div>

        {/* Children Category List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách danh mục con</h2>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm danh mục con..."
                    value={childSearchTerm}
                    onChange={(e) => setChildSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleBulkDeleteChildCategories}
                  disabled={selectedChildCategories.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa đã chọn ({selectedChildCategories.length})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={allChildCategoriesSelected}
                      onChange={(e) => handleSelectAllChildCategories(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên danh mục con
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục cha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChildrenCategories.map((child) => (
                  <tr key={child.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedChildCategories.includes(child.id)}
                        onChange={(e) => handleSelectChildCategory(child.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{child.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FolderOpen className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{child.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Folder className="w-4 h-4 text-emerald-600 mr-2" />
                        <span className="text-sm text-gray-600">
                          {categories.find((cat) => cat.id === child.parentCategoryId)?.categoryName || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{child.description || "Chưa có mô tả"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteChildCategory(child.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-600 bg-red-100 hover:bg-red-200"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredChildrenCategories.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={6}>
                      <div className="flex flex-col items-center space-y-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <FolderOpen className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">
                          {childSearchTerm ? "Không tìm thấy danh mục con phù hợp" : "Chưa có danh mục con nào"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng danh mục cha</p>
              <p className="text-2xl font-bold text-emerald-600">{categories.length}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Folder className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng danh mục con</p>
              <p className="text-2xl font-bold text-blue-600">{childrenCategories.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}