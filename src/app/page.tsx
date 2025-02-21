// src/app/page.tsx
import { NewsCard } from '@/components/sections/news/NewsCard';
import { CourseCard } from '@/components/sections/news/CourseCard';
import { ScrollableSection } from '@/components/sections/news/ScrollableSection';
import { mockNews, mockCourses } from '@/data/mockData';
import {HeaderCrypto} from '@/components/sections/news/HeaderCrypto'
import { CryptoTicker } from '@/components/sections/news/CryptoTicker';
import { FooterCrypto } from '@/components/sections/news/FooterCrypto';
import {Button} from "@/components/ui/button";
import BlogHeader from '@/components/sections/news/BlogNewsHeader';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownmenuItem,
//   DropdownMenuTrigger
// } from "@/components/ui/dropdown-menu";
export default function Home() {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <BlogHeader/>
      <ScrollableSection title="Bài viết nổi bật">
        {mockNews.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </ScrollableSection>

      <ScrollableSection title="Mới Nhất">
        {mockNews.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </ScrollableSection>

      <ScrollableSection title="Xu hướng">
        {mockNews.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </ScrollableSection>

      <ScrollableSection title="Khóa học">
        {mockCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </ScrollableSection>
    </div>
  );
}