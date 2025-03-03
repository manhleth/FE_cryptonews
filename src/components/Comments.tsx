"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface Comment {
    commentId: number;
    userFullName: string;
    userAvartar: string;
    content: string;
    createdAt: string; // ví dụ "2 ngày trước"
}

interface CommentSectionProps {
    newsId: number;
}

export default function CommentSection({ newsId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [visibleCount, setVisibleCount] = useState(5); // Số comment hiển thị ban đầu
    const [newComment, setNewComment] = useState("");
    const token = useAuth();

    useEffect(() => {
        // Giả sử gọi API lấy tất cả comment của bài viết
        fetch(`http://localhost:5000/api/Comment/GetListCommentByNews?newsID=${newsId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                // data.data: mảng comment
                console.log(data);
                setComments(data.data);
            })
            .catch((err) => console.error(err));
    }, [newsId]);

    // Hàm thêm comment mới
    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        fetch("http://localhost:5000/api/Comment/CreateNewComment", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.token}` },
            body: JSON.stringify({ newsId, content: newComment }),
        })
            .then((res) => res.json())
            .then((data) => {
                // data.data: comment mới
                // thêm comment mới vào đầu mảng (hoặc cuối, tuỳ ý)
                setComments((prev) => [...prev, data.data]);
                setNewComment("");
                // Nếu đang hiển thị 5 comment, ta tăng visibleCount để comment mới xuất hiện luôn
                setVisibleCount((prev) => prev + 1);
            })
            .catch((err) => console.error(err));
    };

    // Các comment được hiển thị
    const displayedComments = comments.slice(0, visibleCount);

    return (
        <div className="w-full max-w-4xl mx-auto border rounded-md p-4 ">
            {/* Tiêu đề comment (nếu muốn) */}
            <h2 className="text-lg font-semibold mb-4">Bình luận</h2>

            {/* Khung scrollable cho danh sách comment */}
            <div className="border rounded-md p-3 max-h-96 overflow-y-auto space-y-4">
                {displayedComments.map((comment, index) => (
                    <div key={comment.commentId || index} className="flex items-start gap-2">
                        {/* Ảnh avatar */}
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={comment.userAvartar || "/default-avatar.png"}
                                alt={comment.userFullName}
                            />
                            {/* Lấy ký tự đầu của userName làm fallback, tuỳ chỉnh */}
                            <AvatarFallback>
                                {comment.userFullName?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                        </Avatar>
                        {/* Khối nội dung comment */}
                        <div className="flex-1">
                            <div className="bg-gray-100 rounded-xl p-3">
                                <div className="font-semibold text-sm">{comment.userFullName}</div>
                                <p className="text-sm mt-1">{comment.content}</p>
                            </div>

                        </div>
                    </div>
                ))}

                {/* Nút Xem thêm nếu còn comment ẩn */}
                {visibleCount < comments.length && (
                    <button
                        onClick={() => setVisibleCount((prev) => prev + 5)}
                        className="block mx-auto mt-2 text-blue-600 text-sm hover:underline"
                    >
                        Xem thêm {comments.length - visibleCount} bình luận
                    </button>
                )}
            </div>

            {/* Form nhập comment ở dưới cùng */}
            <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-4">
                <Avatar className="h-8 w-8">
                    <AvatarImage
                        src={token.user?.avatar || "/default-avatar.png"}
                        alt={token.user?.fullname}
                    />
                    {/* Lấy ký tự đầu của userName làm fallback, tuỳ chỉnh */}
                    <AvatarFallback>
                        {token.user?.fullname[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <input
                        className="w-full p-2 border rounded-full focus:outline-none"
                        placeholder="Viết bình luận..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                >
                    Gửi
                </button>
            </form>
        </div>
    );
}
