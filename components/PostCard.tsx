import Link from 'next/link';
import { Post } from '@/lib/mdParser';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="post-card">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition">
          {post.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{formattedDate}</p>
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">{post.summary}</p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </Link>
  );
}

