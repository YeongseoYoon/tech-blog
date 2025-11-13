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
      <article className="group border-b border-gray-100 pb-8 last:border-b-0 hover:border-gray-200 transition-colors">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug">
              {post.title}
            </h2>
            <p className="text-sm text-gray-500 mb-3">{formattedDate}</p>
            <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
              {post.summary}
            </p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

