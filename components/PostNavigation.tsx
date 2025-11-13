import Link from 'next/link';
import { Post } from '@/lib/mdParser';

interface PostNavigationProps {
  prevPost: Post | null;
  nextPost: Post | null;
}

export default function PostNavigation({
  prevPost,
  nextPost,
}: PostNavigationProps) {
  return (
    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 이전 글 */}
        {prevPost ? (
          <Link
            href={`/blog/${prevPost.slug}`}
            className="group p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              PREVIOUS ARTICLE
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {prevPost.title}
            </h3>
          </Link>
        ) : (
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 opacity-50">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              PREVIOUS ARTICLE
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              이전 글이 없습니다
            </p>
          </div>
        )}

        {/* 다음 글 */}
        {nextPost ? (
          <Link
            href={`/blog/${nextPost.slug}`}
            className="group p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              NEXT ARTICLE
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {nextPost.title}
            </h3>
          </Link>
        ) : (
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 opacity-50">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              NEXT ARTICLE
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              다음 글이 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

