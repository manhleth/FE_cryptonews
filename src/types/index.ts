// src/types/index.ts
export interface NewsItem {
    id: number;
    title: string;
    author: string;
    timeAgo: string;
    readTime: string;
    image: string;
    excerpt: string;
  }
  
  export interface Course {
    id: number;
    title: string;
    level: string;
    lessons: number;
    duration: string;
    image: string;
  }