"use client";
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableSectionProps {
  title: string;
  children: React.ReactNode;
  id?:string;
}

export const ScrollableSection = ({ title, children,id }: ScrollableSectionProps) => {
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`scroll-${title}`);
    const scrollAmount = direction === 'left' ? -300 : 300;
    container?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative" id={id}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div
        id={`scroll-${title}`}
        className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
};