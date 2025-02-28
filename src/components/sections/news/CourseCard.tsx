"use client";
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookmarkIcon } from 'lucide-react';

interface CourseCardProps {
  course: {
    Title: string;
    level: string;
    lessons: number;
    duration: string;
    image: string;
  }
}

export const CourseCard = ({ course }: CourseCardProps) => (
  <Card key={course.Title} className="min-w-[300px] md:min-w-[350px] flex-none">
    <img src={course.image} alt={course.Title} className="w-full h-48 object-cover" />
    <CardContent className="p-4">
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.Title}</h3>
      <Badge variant="outline" className="mb-2">
        {course.level}
      </Badge>
      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
        <span>Duration</span>
        <span>{course.lessons} Lessons ({course.duration})</span>
      </div>
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-600">Free course</span>
        <BookmarkIcon className="cursor-pointer" size={20} />
      </div>
    </CardContent>
  </Card>
);
