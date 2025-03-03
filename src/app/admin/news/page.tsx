"use client";

import { useEffect, useState } from "react";

type Article = {
  id: number;
  title: string;
  content: string;
  published: boolean;
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [newArticle, setNewArticle] = useState({
    title: "",
    content: "",
    published: false,
  });
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);

  // Hard-code token từ API (nên thay bằng cách quản lý token hợp lý)
  const valueToken = localStorage.getItem("tokenAdmin");
  // Hàm lấy danh sách tin tức từ API
  const fetchNews = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/News/GetAllNewAdmin", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách tin tức");
      }
      const result = await response.json();
      if (result.statusCode !== 1 || !result.data) {
        throw new Error("Lỗi dữ liệu từ API");
      }
      // Giả sử API trả về mảng tin tức với trường 'newsId' làm id
      const mappedArticles: Article[] = result.data.map((item: any) => ({
        id: item.newsId,
        title: item.title || "",
        content: item.content || "",
        published: item.published,
      }));
      setArticles(mappedArticles);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Hàm thêm bài viết mới

  const handleSelectChange = (id: number, checked: boolean) => {
    if (checked) {
      // Thêm id vào mảng nếu chưa có
      setSelectedArticles((prev) => [...prev, id]);
    } else {
      // Loại bỏ id nếu bỏ chọn
      setSelectedArticles((prev) => prev.filter((item) => item !== id));
    }
  };
  const handleBulkDelete = async () => {
    if (selectedArticles.length === 0) {
      alert("Vui lòng chọn ít nhất một bài viết để xóa.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa những bài viết đã chọn?")) return;

    try {
      // Xóa từng bài viết theo id đã chọn. Có thể dùng Promise.all nếu muốn thực hiện đồng thời.
      await Promise.all(
        selectedArticles.map((id) =>
          fetch(`http://localhost:5000/api/News/AdminDelele?id=${id}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${valueToken}`,
            },
          })
        )
      );
      // Load lại danh sách sau khi xóa
      fetchNews();
    } catch (err: any) {
      setError(err.message);
    }
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Chọn tất cả các bài viết
      const allIds = articles.map((article) => article.id);
      setSelectedArticles(allIds);
    } else {
      // Bỏ chọn tất cả
      setSelectedArticles([]);
    }
  };
  // Hàm xoá bài viết
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/News/AdminDelele?id=${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi xóa bài viết");
      }
      fetchNews();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Hàm chọn bài viết để chỉnh sửa
  const handleEdit = (article: Article) => {
    setEditingArticle(article);
  };

  // Hàm cập nhật bài viết
  const allSelected = articles.length > 0 && selectedArticles.length === articles.length;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Bảo trì tin tức</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {/* Nút xoá bài viết đã chọn */}
      <div className="mb-4">
        <button
          onClick={handleBulkDelete}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Xóa bài viết đã chọn
        </button>
      </div>

      {/* Danh sách bài viết */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="border p-2">ID</th>
            <th className="border p-2">Tiêu đề</th>
            <th className="border p-2">Nội dung</th>
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              {/* Checkbox để chọn bài viết */}
              <td className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedArticles.includes(article.id)}
                  onChange={(e) => handleSelectChange(article.id, e.target.checked)}
                />
              </td>
              <td className="border p-2 text-center">{article.id}</td>
              <td className="border p-2">{article.title.slice(0, 20) + "..."}</td>
              <td className="border p-2">{article.content.slice(0, 20) + "..."}</td>
              <td className="border p-2 text-center">

                <button
                  onClick={() => handleDelete(article.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2"
                >
                  Xoá
                </button>
              </td>
            </tr>
          ))}
          {articles.length === 0 && (
            <tr>
              <td className="border p-2 text-center" colSpan={5}>
                Không có bài viết nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
