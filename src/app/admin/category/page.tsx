"use client";

import { useEffect, useState } from "react";

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

  const [error, setError] = useState("");
  const valueToken = localStorage.getItem("tokenAdmin");

  // Lấy danh sách danh mục cha từ API
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

  // ======== Phần Danh Mục Cha ========

  // Thêm danh mục cha mới
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert("Vui lòng nhập tên danh mục");
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
        body: JSON.stringify({ categoryName: newCategoryName }),
      });
      const result = await response.json();
      if (!response.ok || result.statusCode !== 1) {
        throw new Error(result.message || "Lỗi khi tạo danh mục");
      }
      setNewCategoryName("");
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
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Xóa nhiều danh mục cha đã chọn
  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.length === 0) {
      alert("Vui lòng chọn ít nhất một danh mục để xóa.");
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
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Chỉnh sửa danh mục cha
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(
        categories.map((c) => (c.id === editingCategory.id ? editingCategory : c))
      );
      setEditingCategory(null);
    }
  };

  const handleSelectCategory = (id: number, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleSelectAllCategories = (checked: boolean) => {
    setSelectedCategories(checked ? categories.map((c) => c.id) : []);
  };

  const allCategoriesSelected =
    categories.length > 0 && selectedCategories.length === categories.length;

  // ======== Phần Danh Mục Con ========

  // Thêm danh mục con mới
  const handleCreateChildCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildCategory.name.trim()) {
      alert("Vui lòng nhập tên danh mục con");
      return;
    }
    if (!newChildCategory.parentCategoryId) {
      alert("Vui lòng chọn danh mục cha");
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
      fetchChildrenCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Xóa nhiều danh mục con đã chọn
  const handleBulkDeleteChildCategories = async () => {
    if (selectedChildCategories.length === 0) {
      alert("Vui lòng chọn ít nhất một danh mục con để xóa.");
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
    setSelectedChildCategories(checked ? childrenCategories.map((c) => c.id) : []);
  };

  const allChildCategoriesSelected =
    childrenCategories.length > 0 &&
    selectedChildCategories.length === childrenCategories.length;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Quản lý Danh Mục</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* ===== Phần Danh Mục Cha ===== */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Danh Mục Cha</h2>
        {/* Form Thêm Danh Mục Cha */}
        <form onSubmit={handleCreateCategory} className="mb-6 space-y-4 border p-4 rounded shadow">
          <h3 className="text-xl font-bold">Thêm danh mục mới</h3>
          <div>
            <label className="block text-gray-700">Tên danh mục</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Nhập tên danh mục"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isCreating ? "Đang tạo..." : "Thêm danh mục"}
          </button>
        </form>

        {/* Nút Xóa Danh Mục Đã Chọn */}
        <div className="mb-4">
          <button
            onClick={handleBulkDeleteCategories}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Xóa danh mục đã chọn
          </button>
        </div>

        {/* Form Chỉnh Sửa Danh Mục Cha */}
        {editingCategory && (
          <form onSubmit={handleUpdateCategory} className="mb-6 space-y-4 border p-4 rounded shadow">
            <h3 className="text-xl font-bold">Chỉnh sửa danh mục</h3>
            <div>
              <label className="block text-gray-700">Tên danh mục</label>
              <input
                type="text"
                value={editingCategory.categoryName}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, categoryName: e.target.value })
                }
                required
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div>
              <label className="block text-gray-700">Mô tả</label>
              <textarea
                value={editingCategory.description}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, description: e.target.value })
                }
                required
                className="w-full p-2 border rounded mt-1"
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
                Cập nhật
              </button>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Danh sách Danh Mục Cha */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={allCategoriesSelected}
                  onChange={(e) => handleSelectAllCategories(e.target.checked)}
                />
              </th>
              <th className="border p-2">ID</th>
              <th className="border p-2">Tên danh mục</th>
              <th className="border p-2">Mô tả</th>
              <th className="border p-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => handleSelectCategory(category.id, e.target.checked)}
                  />
                </td>
                <td className="border p-2 text-center">{category.id}</td>
                <td className="border p-2">{category.categoryName}</td>
                <td className="border p-2">{category.description}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td className="border p-2 text-center" colSpan={5}>
                  Không có danh mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ===== Phần Danh Mục Con ===== */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Danh Mục Con</h2>
        {/* Form Thêm Danh Mục Con */}
        <form onSubmit={handleCreateChildCategory} className="mb-6 space-y-4 border p-4 rounded shadow">
          <h3 className="text-xl font-bold">Thêm danh mục con mới</h3>
          <div>
            <label className="block text-gray-700">Tên danh mục con</label>
            <input
              type="text"
              value={newChildCategory.name}
              onChange={(e) => setNewChildCategory({ ...newChildCategory, name: e.target.value })}
              required
              className="w-full p-2 border rounded mt-1"
              placeholder="Nhập tên danh mục con"
            />
          </div>
          <div>
            <label className="block text-gray-700">Danh mục cha</label>
            <select
              value={newChildCategory.parentCategoryId}
              onChange={(e) =>
                setNewChildCategory({ ...newChildCategory, parentCategoryId: Number(e.target.value) })
              }
              required
              className="w-full p-2 border rounded mt-1"
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
            <label className="block text-gray-700">Mô tả</label>
            <textarea
              value={newChildCategory.description}
              onChange={(e) =>
                setNewChildCategory({ ...newChildCategory, description: e.target.value })
              }
              className="w-full p-2 border rounded mt-1"
              placeholder="Nhập mô tả (nếu cần)"
            />
          </div>
          <button
            type="submit"
            disabled={isCreatingChild}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isCreatingChild ? "Đang tạo..." : "Thêm danh mục con"}
          </button>
        </form>

        {/* Nút Xóa Danh Mục Con Đã Chọn */}
        <div className="mb-4">
          <button
            onClick={handleBulkDeleteChildCategories}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Xóa danh mục con đã chọn
          </button>
        </div>

        {/* Danh sách Danh Mục Con */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={allChildCategoriesSelected}
                  onChange={(e) => handleSelectAllChildCategories(e.target.checked)}
                />
              </th>
              <th className="border p-2">ID</th>
              <th className="border p-2">Tên danh mục con</th>
              <th className="border p-2">Danh mục cha</th>
              <th className="border p-2">Mô tả</th>
              <th className="border p-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {childrenCategories.map((child) => (
              <tr key={child.id}>
                <td className="border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedChildCategories.includes(child.id)}
                    onChange={(e) => handleSelectChildCategory(child.id, e.target.checked)}
                  />
                </td>
                <td className="border p-2 text-center">{child.id}</td>
                <td className="border p-2">{child.name}</td>
                <td className="border p-2">
                  {
                    // Hiển thị tên danh mục cha dựa vào parentCategoryId
                    categories.find((cat) => cat.id === child.parentCategoryId)?.categoryName || "N/A"
                  }
                </td>
                <td className="border p-2">{child.description}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleDeleteChildCategory(child.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
            {childrenCategories.length === 0 && (
              <tr>
                <td className="border p-2 text-center" colSpan={6}>
                  Không có danh mục con nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
