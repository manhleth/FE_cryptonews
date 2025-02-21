// src/app/news/[id]/page.tsx
"use client"
import { notFound } from "next/navigation";
import { mockNews } from "@/data/mockData";
import { FooterCrypto } from "@/components/sections/news/FooterCrypto";
import { Share2, BookmarkIcon } from "lucide-react";
import { use } from "react";
import { promises } from "dns";

interface NewsDetailPageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const resolvedParams = params instanceof Promise ? params : Promise.resolve(params);
  const { id } = use(resolvedParams);
  const item = mockNews.find((newsItem) => newsItem.id === Number(id));

  // Nếu không tìm thấy bài viết thì trả về notFound
  if (!item) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Phần header của bài viết */}
      <header className="border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          {/* Giả sử bạn có một logo hoặc tên trang */}
          <div className="flex items-center gap-2">
            <img
              src="/api/placeholder/32/32"
              alt="Coin98 Insights"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-semibold">Coin98 Insights</span>
          </div>
          <button className="px-3 py-1 border rounded-full text-sm hover:bg-gray-100">
            Follow
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {item.title}
        </h1>

        {/* Thông tin tác giả, thời gian */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <img
            src="/api/placeholder/24/24"
            alt={item.author}
            className="w-6 h-6 rounded-full"
          />
          <span>{item.author}</span>
          <span>•</span>
          <span>{item.timeAgo}</span>
          <span>•</span>
          <span>{item.readTime}</span>
        </div>
      </header>

      {/* Nội dung chính của bài viết */}
      <article className="space-y-4 leading-relaxed">
        {/* Ảnh minh họa bài viết nếu cần */}
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-auto object-cover rounded-md"
        />

        {/* Đoạn text mô phỏng */}
        <p>
          Sau khi DeepSeek-R1 ra mắt, các dự án crypto bắt đầu tích hợp mô hình
          mã nguồn mở này để cải thiện trải nghiệm người dùng. Dự án Venice AI
          cũng có động thái tương tự khi người dùng có thể trải nghiệm DeepSeek-R1
          ngay trên ứng dụng.
        </p>
        <p>
          Nếu công suất API của Venice đạt mức 10,000 VCU, và một người dùng nắm
          giữ 1% tổng số VVV đã stake thì mỗi ngày người đó có quyền sử dụng
          tương đương 100 VCU. Thế đó, công suất API mà người dùng có thể sử dụng
          không phải là ảo mà là có giới hạn...
        </p>
        <p>
          Bên cạnh đó, dự án cung cấp khả năng truy cập thị trường mà không yêu
          cầu đăng ký. Người dùng có thể khai thác sức mạnh của Venice AI để tìm
          kiếm thông tin chuyên sâu, phân tích dữ liệu và nhiều tính năng hơn nữa.
        </p>
      </article>

      {/* Nút share, bookmark... (nếu muốn) */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100">
          <Share2 size={20} />
          Share
        </button>
        <button className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100">
          <BookmarkIcon size={20} />
          Bookmark
        </button>
      </div>

      {/* Footer của bài viết - Related Posts */}
      <section className="border-t pt-4">
        <h2 className="text-xl font-semibold mb-4">Related Posts</h2>
        {/* Render các bài viết liên quan, có thể là mockNews hoặc API */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockNews.slice(0, 4).map((related) => (
            <div key={related.id} className="border rounded-md p-3 space-y-2">
              <img
                src={related.image}
                alt={related.title}
                className="w-full h-32 object-cover rounded-md"
              />
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <img
                  src="/api/placeholder/24/24"
                  alt={related.author}
                  className="w-5 h-5 rounded-full"
                />
                <span>{related.author}</span>
                <span>•</span>
                <span>{related.timeAgo}</span>
              </div>
              <h3 className="font-semibold text-base line-clamp-2">
                {related.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {related.excerpt}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer toàn trang (nếu muốn dùng) */}
      <FooterCrypto />
    </div>
  );
}
