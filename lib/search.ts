import { Post } from './mdParser';

export interface SearchResult {
  posts: Post[];
  query: string;
  tags: string[];
}

// 제목과 요약으로 검색
export function searchPosts(posts: Post[], query: string): Post[] {
  if (!query.trim()) {
    return posts;
  }

  const lowercaseQuery = query.toLowerCase();

  return posts.filter((post) => {
    const title = post.title.toLowerCase();
    const summary = post.summary.toLowerCase();
    const content = post.content.toLowerCase();

    return title.includes(lowercaseQuery) || summary.includes(lowercaseQuery) || content.includes(lowercaseQuery);
  });
}

// 태그로 필터링
export function filterByTags(posts: Post[], selectedTags: string[]): Post[] {
  if (selectedTags.length === 0) {
    return posts;
  }

  return posts.filter((post) =>
    selectedTags.some((tag) => post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()))
  );
}

// 모든 고유 태그 가져오기
export function getAllTags(posts: Post[]): string[] {
  const tagsSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagsSet.add(tag);
    });
  });

  return Array.from(tagsSet).sort();
}

// 검색과 필터링 결합
export function searchAndFilter(posts: Post[], query: string, selectedTags: string[]): Post[] {
  let results = posts;

  // 먼저 태그로 필터링
  results = filterByTags(results, selectedTags);

  // 그 다음 검색어로 검색
  results = searchPosts(results, query);

  return results;
}

