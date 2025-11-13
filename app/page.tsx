"use client";

import { useEffect, useState } from "react";
import { Post } from "@/lib/mdParser";
import { searchAndFilter, getAllTags } from "@/lib/search";
import SearchBar from "@/components/SearchBar";
import TagFilter from "@/components/TagFilter";
import PostCard from "@/components/PostCard";
import FeaturedPosts from "@/components/FeaturedPosts";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모든 포스트 로드
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch("/api/posts");
        if (!response.ok) throw new Error("Failed to fetch posts");
        const data = await response.json();
        setPosts(data);
        setAllTags(getAllTags(data));
      } catch (error) {
        // Error loading posts
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  // 검색 및 필터링 적용
  useEffect(() => {
    const results = searchAndFilter(posts, searchQuery, selectedTags);
    setFilteredPosts(results);
  }, [posts, searchQuery, selectedTags]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 메인 컨텐츠 영역 */}
        <div className="lg:col-span-8">
          {/* 검색바 */}
          <div className="mb-8">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="제목, 요약, 내용으로 검색..."
            />
          </div>

          {/* 태그 필터 */}
          <div className="mb-10">
            <TagFilter
              tags={allTags}
              selectedTags={selectedTags}
              onTagChange={setSelectedTags}
            />
          </div>

          {/* 포스트 목록 */}
          <div>
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedTags.length > 0 || searchQuery
                  ? "검색 결과"
                  : "최신 글"}
              </h2>
              <span className="text-sm text-gray-500 font-medium">
                {filteredPosts.length}개
              </span>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-8">
            <FeaturedPosts posts={posts} />
          </div>
        </aside>
      </div>
    </div>
  );
}
