"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookmarkIcon, Link2Icon, Clock } from "lucide-react";

/** Kiểu dữ liệu mỗi bài */
interface BlogPost {
  id: number;
  author: {
    name: string;
    image: string;
  };
  timeAgo: string;
  title: string;
  readTime: string;
  thumbnail: string;
  excerpt: string;
}

/** 7 bài mẫu */
const posts: BlogPost[] = [
  {
    id: 1,
    author: { name: "nguyennsh", image: "/placeholder/avatar.jpg" },
    timeAgo: "1 hour ago",
    title: "Dự án CrossFi núp bóng crypto lừa đảo 2,000 tỷ VND",
    readTime: "4 min read",
    thumbnail: "/placeholder/400/250.jpg",
    excerpt: "Dự án CrossFi núp bóng crypto để dụ dỗ nhà đầu tư...",
  },
  {
    id: 2,
    author: { name: "nguyennsh", image: "/placeholder/avatar.jpg" },
    timeAgo: "2 hours ago",
    title: "PI niêm yết 2 USD, trở thành kèo airdrop lịch sử",
    readTime: "3 min read",
    thumbnail: "/placeholder/400/250.jpg",
    excerpt: "9 ngày kể từ lúc OKX 'nổ phát súng' thông báo niêm yết PI...",
  },
  {
    id: 3,
    author: { name: "nghianq", image: "/placeholder/avatar.jpg" },
    timeAgo: "3 hours ago",
    title: "Blockchain 'giải cứu' AI khỏi Big Techadhfjajsdhfjahsdkljfhalskdjhfaljsdhfalsjkdhfládjfhakjsdhflakjsdhflakjsdhflajsdhfladsfadfasdfgsdfgsdfgsdfgsdfgsdf?",
    readTime: "9 min read",
    thumbnail: "/placeholder/400/250.jpg",
    excerpt: "Với việc minh bạch hóa dữ liệu, phi tập trung hóa tài nguyên...ahjgkdflđldldldldldldldldldldldldldldldldldldldldldldldldldldldldl",
  },
  {
    id: 4,
    author: { name: "nguyennsh", image: "/placeholder/avatar.jpg" },
    timeAgo: "4 hours ago",
    title: "Soon Network: Blockchain layer 2 tương thích SVM",
    readTime: "2 min read",
    thumbnail: "/placeholder/400/250.jpg",
    excerpt: "Soon Network ra lộ trình, tham vọng mở rộng hệ sinh thái...",
  },
  {
    id: 5,
    author: { name: "linhnt", image: "/placeholder/avatar.jpg" },
    timeAgo: "5 hours ago",
    title: "PI niêm yết 2 USD, trở thành kèo airdrop lịch sử",
    readTime: "3 min read",
    thumbnail: "/placeholder/400/250.jpg",
    excerpt: "Sau khi DeepSeek-R1 ra mắt, các dự án crypto bắt đầu...",
  },
  {
    id: 6,
    author: { name: "linnht", image: "/placeholder/avatar.jpg" },
    timeAgo: "6 hours ago",
    title: "Venice AI (VVY): AI Chatbot tích hợp mô hình AI DeepSeek-R1",
    readTime: "7 min read",
    thumbnail: "/placeholder/400/250.jpg",
    excerpt: "Dự án CrossFi núp bóng crypto để dụ dỗ nhà đầu tư...",
  },
  {
    id: 7,
    author: { name: "nguyennsh", image: "/placeholder/avatar.jpg" },
    timeAgo: "7 hours ago",
    title: "Dự án CrossFi núp bóng crypto lừa đảo 2,000 tỷ VND",
    readTime: "4 min read",
    thumbnail: "/placeholder/400/avatar.jpg",
    excerpt: "Dự án CrossFi núp bóng crypto để dụ dỗ nhà đầu tư...",
  },
];

export default function BlogHeader() {
  // 2 bài medium bên trái
  const leftPosts = posts.slice(0, 2);

  // 1 bài to nhất ở giữa
  const centerPost = posts[2];

  // 4 bài nhỏ bên phải
  const rightPosts = posts.slice(3);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Chia 3 cột: 3 + 5 + 4 = 12 */}
      <div className="grid grid-cols-12 gap-6">
        {/* Cột trái: 2 bài medium */}
        <div className="col-span-3 space-y-6">
          {leftPosts.map((post) => (
            <MediumPostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Cột giữa: 1 bài to nhất */}
        <div className="col-span-6">
          <BiggestPostCard post={centerPost} />
        </div>

        {/* Cột phải: 4 bài nhỏ */}
        <div className="col-span-3 space-y-6">
          {rightPosts.map((post) => (
            <SmallPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}

/** Bài cỡ trung bình (cột trái) */
function MediumPostCard({ post }: { post: BlogPost }) {
  return (
    <Card className="hover:bg-gray-50 cursor-pointer border-none shadow-none">
      <div className="relative w-full h-48">
        <Image
          src={post.thumbnail}
          alt={post.title}
          fill
          className="object-cover rounded-t"
        />
      </div>
      <CardContent className="p-4">
        {/* Tác giả & thời gian */}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
          <Avatar className="h-5 w-5">
            <AvatarImage src={post.author.image} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <span>{post.author.name}</span>
          <span>•</span>
          <span>{post.timeAgo}</span>
        </div>

        {/* Tiêu đề */}
        <h3 className="font-semibold text-base mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Mô tả ngắn */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{post.readTime}</span>
          </div>
          <div className="flex gap-2">
            <button className="hover:text-gray-700">
              <BookmarkIcon className="h-4 w-4" />
            </button>
            <button className="hover:text-gray-700">
              <Link2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Bài to nhất (cột giữa) */
function BiggestPostCard({ post }: { post: BlogPost }) {
  if (!post) return null;
  return (
    <Card className="hover:bg-gray-50 cursor-pointer border-none shadow-none h-full flex flex-col">
      <div className="relative w-full h-72">
        <Image
          src={post.thumbnail}
          alt={post.title}
          fill
          className="object-cover rounded-t"
        />
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Tác giả & thời gian */}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
          <Avatar className="h-5 w-5">
            <AvatarImage src={post.author.image} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <span>{post.author.name}</span>
          <span>•</span>
          <span>{post.timeAgo}</span>
        </div>

        {/* Tiêu đề */}
        <h3 className="font-semibold text-2xl mb-2 line-clamp-2">{post.title}</h3>

        {/* Mô tả ngắn */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{post.readTime}</span>
          </div>
          <div className="flex gap-2">
            <button className="hover:text-gray-700">
              <BookmarkIcon className="h-4 w-4" />
            </button>
            <button className="hover:text-gray-700">
              <Link2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Bài nhỏ (cột phải) */
function SmallPostCard({ post }: { post: BlogPost }) {
  return (
    <Card className="hover:bg-gray-50 cursor-pointer flex border-none shadow-none">
      {/* Ảnh nhỏ */}
      <div className="relative w-24 h-20 flex-shrink-0">
        <Image
          src={post.thumbnail}
          alt={post.title}
          fill
          className="object-cover rounded-l"
        />
      </div>
      <CardContent className="p-3 flex-1">
        <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
          <Avatar className="h-4 w-4">
            <AvatarImage src={post.author.image} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <span>{post.author.name}</span>
          <span>•</span>
          <span>{post.timeAgo}</span>
        </div>
        <h4 className="font-medium text-sm mb-1 line-clamp-2">{post.title}</h4>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{post.readTime}</span>
          <div className="flex gap-2">
            <button className="hover:text-gray-700">
              <BookmarkIcon className="h-3 w-3" />
            </button>
            <button className="hover:text-gray-700">
              <Link2Icon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
