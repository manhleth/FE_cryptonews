"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookmarkIcon, Link2Icon, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Author {
  name: string;
  image: string;
}

interface BlogPost {
  id: number;
  author: Author;
  timeAgo: string;
  title: string;
  readTime: string;
  thumbnail: string;
  excerpt: string;
  views?: number;
  tags?: string[];
}

interface BlogHeaderProps {
  posts?: BlogPost[];
  isLoading?: boolean;
}

// Utility functions
const formatViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

// Skeleton Components
const PostSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn("animate-pulse", className)}>
    <div className="relative w-full h-48 bg-gray-200 rounded-t" />
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-gray-200 rounded-full" />
        <div className="w-20 h-4 bg-gray-200 rounded" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
      <div className="w-full h-6 bg-gray-200 rounded mb-2" />
      <div className="w-3/4 h-4 bg-gray-200 rounded mb-4" />
      <div className="flex justify-between items-center">
        <div className="w-16 h-4 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Post Components
interface PostActionsProps {
  postId: number;
  views?: number;
  readTime: string;
  className?: string;
}

const PostActions: React.FC<PostActionsProps> = ({ postId, views, readTime, className }) => (
  <div className={cn("flex items-center justify-between text-sm text-gray-500", className)}>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>{readTime}</span>
      </div>
      {views && (
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{formatViews(views)}</span>
        </div>
      )}
    </div>
    <div className="flex gap-2">
      <button 
        className="hover:text-gray-700 transition-colors"
        aria-label="Bookmark post"
      >
        <BookmarkIcon className="h-4 w-4" />
      </button>
      <button 
        className="hover:text-gray-700 transition-colors"
        aria-label="Share post"
      >
        <Link2Icon className="h-4 w-4" />
      </button>
    </div>
  </div>
);

interface AuthorInfoProps {
  author: Author;
  timeAgo: string;
  size?: 'sm' | 'md' | 'lg';
}

const AuthorInfo: React.FC<AuthorInfoProps> = ({ author, timeAgo, size = 'md' }) => {
  const sizeClasses = {
    sm: { avatar: 'h-4 w-4', text: 'text-xs' },
    md: { avatar: 'h-5 w-5', text: 'text-sm' },
    lg: { avatar: 'h-6 w-6', text: 'text-base' }
  };

  return (
    <div className={cn("flex items-center gap-2 text-gray-500", sizeClasses[size].text)}>
      <Avatar className={sizeClasses[size].avatar}>
        <AvatarImage src={author.image} alt={author.name} />
        <AvatarFallback>{author.name[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{author.name}</span>
      <span>•</span>
      <time dateTime={timeAgo}>{timeAgo}</time>
    </div>
  );
};

// Post Card Components
interface BasePostCardProps {
  post: BlogPost;
  priority?: boolean;
}

const MediumPostCard: React.FC<BasePostCardProps> = ({ post, priority = false }) => (
  <Link href={`/news/${post.id}`} className="group">
    <Card className="border-none shadow-none hover:bg-gray-50 transition-colors">
      <div className="relative w-full h-48 overflow-hidden rounded-t">
        <Image
          src={post.thumbnail}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {post.views && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
            <Eye className="inline w-3 h-3 mr-1" />
            {formatViews(post.views)}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <AuthorInfo author={post.author} timeAgo={post.timeAgo} size="sm" />
        <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {post.excerpt}
        </p>
        <PostActions postId={post.id} readTime={post.readTime} />
      </CardContent>
    </Card>
  </Link>
);

const BiggestPostCard: React.FC<BasePostCardProps> = ({ post, priority = true }) => (
  <Link href={`/news/${post.id}`} className="group">
    <Card className="border-none shadow-none hover:bg-gray-50 transition-colors h-full flex flex-col">
      <div className="relative w-full h-72 overflow-hidden rounded-t">
        <Image
          src={post.thumbnail}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
        />
        {post.views && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium">
            <Eye className="inline w-4 h-4 mr-1" />
            {formatViews(post.views)}
          </div>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              {post.tags[0]}
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <AuthorInfo author={post.author} timeAgo={post.timeAgo} />
        <h2 className="font-bold text-2xl mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
          {post.excerpt}
        </p>
        <PostActions postId={post.id} views={post.views} readTime={post.readTime} className="mt-auto" />
      </CardContent>
    </Card>
  </Link>
);

const SmallPostCard: React.FC<BasePostCardProps> = ({ post }) => (
  <Link href={`/news/${post.id}`} className="group">
    <Card className="border-none shadow-none hover:bg-gray-50 transition-colors">
      <div className="flex gap-3 p-3">
        <div className="relative w-24 h-20 flex-shrink-0 overflow-hidden rounded">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="96px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <AuthorInfo author={post.author} timeAgo={post.timeAgo} size="sm" />
          <h4 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {post.title}
          </h4>
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
        </div>
      </div>
    </Card>
  </Link>
);

// Empty State Component
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts available</h3>
    <p className="text-gray-500 text-sm">Check back later for new content.</p>
  </div>
);

// Main Component
const BlogHeader: React.FC<BlogHeaderProps> = ({ posts, isLoading = false }) => {
  const { leftPosts, centerPost, rightPosts } = useMemo(() => {
    if (!posts || posts.length === 0) {
      return { leftPosts: [], centerPost: null, rightPosts: [] };
    }

    return {
      leftPosts: posts.slice(0, 2),
      centerPost: posts[2],
      rightPosts: posts.slice(3)
    };
  }, [posts]);

  // Loading state
  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <PostSkeleton />
            <PostSkeleton />
          </div>
          <div className="lg:col-span-6">
            <PostSkeleton className="h-full" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <PostSkeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-6">
        <EmptyState />
      </main>
    );
  }

  // Render posts
  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - 2 medium posts */}
        <div className="lg:col-span-3 space-y-6">
          {leftPosts.map((post) => (
            <MediumPostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Center Column - 1 big post */}
        <div className="lg:col-span-6">
          {centerPost && <BiggestPostCard post={centerPost} />}
        </div>

        {/* Right Column - 4 small posts */}
        <div className="lg:col-span-3 space-y-3">
          {rightPosts.map((post) => (
            <SmallPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
};

export default BlogHeader;