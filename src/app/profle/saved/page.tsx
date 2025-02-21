import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bookmark } from "lucide-react";

export default function SavedPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Saved</h1>
        <div className="flex items-center">
          <button className="text-gray-600 hover:text-gray-900">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent space-x-8">
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none bg-transparent px-0 rounded-none text-base font-normal"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="courses"
              className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:shadow-none bg-transparent px-0 rounded-none text-base font-normal text-gray-500"
            >
              Courses
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="posts" className="mt-12">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 mb-4">
              <Bookmark className="w-full h-full text-yellow-700/20" strokeWidth={1} />
            </div>
            <p className="text-gray-500 mb-4">Your saved posts will appear here</p>
            <button className="px-6 py-2 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 transition-colors">
              Explore posts
            </button>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="mt-12">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 mb-4">
              <Bookmark className="w-full h-full text-yellow-700/20" strokeWidth={1} />
            </div>
            <p className="text-gray-500 mb-4">Your saved courses will appear here</p>
            <button className="px-6 py-2 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 transition-colors">
              Explore courses
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}