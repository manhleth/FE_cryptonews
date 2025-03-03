"use client";

import { useEffect, useState } from "react";

type Comment = {
  id: number;
  author: string;
  content: string;
  approved: boolean;
};

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [error, setError] = useState("");
  // Danh sách id của comment được chọn
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  
  // Lấy token (nếu cần)
  const valueToken = localStorage.getItem("tokenAdmin");

  // Hàm lấy danh sách comment từ API
  const fetchComments = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/Comment/GetAllCommentAdmin", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${valueToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách bình luận");
      }
      const result = await response.json();
      // Giả sử API trả về dạng { statusCode: 1, data: [...] }
      if (result.statusCode !== 1 || !result.data) {
        throw new Error("Lỗi dữ liệu từ API");
      }
      // Nếu API trả về key khác, hãy chỉnh sửa phần mapping này
      const mappedComments: Comment[] = result.data.map((item: any) => ({
        id: item.commentId, // Giả sử API trả về commentId
        author: item.author || "",
        content: item.content || "",
        approved: item.approved,
      }));
      setComments(mappedComments);
      // Reset danh sách đã chọn sau khi load lại
      setSelectedComments([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = (id: number) => {
    setComments(comments.filter((c) => c.id !== id));
  };

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingComment) {
      setComments(
        comments.map((c) => (c.id === editingComment.id ? editingComment : c))
      );
      setEditingComment(null);
    }
  };

  const handleApproveToggle = (id: number) => {
    setComments(
      comments.map((c) =>
        c.id === id ? { ...c, approved: !c.approved } : c
      )
    );
  };

  // Xử lý chọn bỏ checkbox của từng comment
  const handleSelectChange = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedComments((prev) => [...prev, id]);
    } else {
      setSelectedComments((prev) => prev.filter((item) => item !== id));
    }
  };

  // Xử lý chọn/bỏ chọn tất cả
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = comments.map((comment) => comment.id);
      setSelectedComments(allIds);
    } else {
      setSelectedComments([]);
    }
  };

  // Xoá nhiều comment được chọn
  const handleBulkDelete = async () => {
    if (selectedComments.length === 0) {
      alert("Vui lòng chọn ít nhất một bình luận để xóa.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa những bình luận đã chọn?")) return;

    try {
      // Xóa từng comment đã chọn (thực hiện đồng thời với Promise.all)
      await Promise.all(
        selectedComments.map((id) =>
          fetch(`http://localhost:5000/api/Comment/DeleteCommentByAdmin?commentID=${id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${valueToken}`,
            },
          })
        )
      );
      // Sau khi xoá, load lại danh sách comment
      fetchComments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Kiểm tra xem tất cả các comment đã được chọn hay chưa
  const allSelected = comments.length > 0 && selectedComments.length === comments.length;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Quản lý bình luận</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Nút xoá comment đã chọn */}
      <div className="mb-4">
        <button
          onClick={handleBulkDelete}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Xóa bình luận đã chọn
        </button>
      </div>

      {/* Form chỉnh sửa bình luận */}
      {editingComment && (
        <form onSubmit={handleUpdate} className="mb-6 space-y-4 border p-4 rounded shadow">
          <h2 className="text-xl font-bold">Chỉnh sửa bình luận</h2>
          <div>
            <label className="block text-gray-700">Tác giả</label>
            <input
              type="text"
              value={editingComment.author}
              onChange={(e) =>
                setEditingComment({ ...editingComment, author: e.target.value } as Comment)
              }
              required
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="block text-gray-700">Nội dung</label>
            <textarea
              value={editingComment.content}
              onChange={(e) =>
                setEditingComment({ ...editingComment, content: e.target.value } as Comment)
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
              onClick={() => setEditingComment(null)}
              className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Danh sách bình luận */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            {/* Cột checkbox chọn tất cả */}
            <th className="border p-2 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th className="border p-2">ID</th>
            <th className="border p-2">Tác giả</th>
            <th className="border p-2">Nội dung</th>
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => (
            <tr key={comment.id}>
              {/* Checkbox để chọn comment */}
              <td className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedComments.includes(comment.id)}
                  onChange={(e) => handleSelectChange(comment.id, e.target.checked)}
                />
              </td>
              <td className="border p-2 text-center">{comment.id}</td>
              <td className="border p-2">{comment.author}</td>
              <td className="border p-2">{comment.content}</td>
             
              <td className="border p-2 text-center">
                
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2"
                >
                  Xoá
                </button>
                <button
                  onClick={() => handleApproveToggle(comment.id)}
                  className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 ml-2"
                >
                  {comment.approved ? "Bỏ duyệt" : "Duyệt"}
                </button>
              </td>
            </tr>
          ))}
          {comments.length === 0 && (
            <tr>
              <td className="border p-2 text-center" colSpan={6}>
                Không có bình luận nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
