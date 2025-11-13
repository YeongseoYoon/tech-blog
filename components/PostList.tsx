"use client";

import { useState, useEffect } from "react";
import { Post } from "@/lib/mdParser";
import { searchAndFilter, getAllTags } from "@/lib/search";
import SearchBar from "@/components/SearchBar";
import TagFilter from "@/components/TagFilter";
import PostCard from "@/components/PostCard";
import TypingAnimation from "@/components/TypingAnimation";

interface PostListProps {
  posts: Post[];
  allTags: string[];
}

export default function PostList({ posts: initialPosts, allTags: initialTags }: PostListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(initialPosts);

  // 검색 및 필터링 적용
  useEffect(() => {
    const results = searchAndFilter(initialPosts, searchQuery, selectedTags);
    setFilteredPosts(results);
  }, [initialPosts, searchQuery, selectedTags]);

  return (
    <>
      {/* 타이핑 애니메이션 */}
      <div className="mb-6">
        <TypingAnimation
          text="안녕하세요 프론트엔드 개발자 윤영서입니다."
          speed={100}
          className="text-2xl font-medium"
        />
      </div>

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
          tags={initialTags}
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
    </>
  );
}

