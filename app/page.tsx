'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/lib/mdParser';
import { searchAndFilter, getAllTags } from '@/lib/search';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import PostCard from '@/components/PostCard';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모든 포스트 로드
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        setPosts(data);
        setAllTags(getAllTags(data));
      } catch (error) {
        console.error('Error loading posts:', error);
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
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">기술 블로그에 오신 것을 환영합니다!</h1>
        <p className="text-lg text-gray-600">
          개발 경험과 기술 지식을 공유하는 블로그입니다.
        </p>
      </div>

      {/* 검색바 */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="제목, 요약, 내용으로 검색..."
      />

      {/* 태그 필터 */}
      <TagFilter
        tags={allTags}
        selectedTags={selectedTags}
        onTagChange={setSelectedTags}
      />

      {/* 포스트 목록 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {selectedTags.length > 0 || searchQuery
            ? `검색 결과: ${filteredPosts.length}개`
            : `최신 글: ${filteredPosts.length}개`}
        </h2>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {filteredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

