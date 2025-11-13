'use client';

import Link from 'next/link';
import { Post } from '@/lib/mdParser';

interface FeaturedPostsProps {
  posts: Post[];
}

export default function FeaturedPosts({ posts }: FeaturedPostsProps) {
  // featured가 true인 포스트만 필터링하고 최대 3개만 표시
  const featuredPosts = posts
    .filter((post) => post.featured)
    .slice(0, 3);

  if (featuredPosts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          추천 글
        </h3>
        <p className="text-sm text-gray-500">추천 글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        추천 글
      </h3>
      <ul className="space-y-3">
        {featuredPosts.map((post, index) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex items-start gap-3 hover:text-blue-600 transition-colors"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                  {post.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {post.summary}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

