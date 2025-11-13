import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Post, getAllPostSlugs, getPostBySlug } from '@/lib/mdParser';
import TableOfContents from '@/components/TableOfContents';
import Giscus from '@/components/Giscus';
import CodeCopyHandler from '@/components/CodeCopyHandler';
import ReadingProgress from '@/components/ReadingProgress';

interface BlogPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다.',
    };
  }

  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <CodeCopyHandler />
      <ReadingProgress />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 뒤로 가기 버튼 */}
      <Link
        href="/"
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 transition"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        돌아가기
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 메인 컨텐츠 */}
        <article className="lg:col-span-3">
          {/* 포스트 헤더 */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{post.title}</h1>
            <div className="flex items-center justify-between mb-6">
              <time className="text-gray-600 dark:text-gray-400">{formattedDate}</time>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 italic">{post.summary}</p>
          </header>

          {/* 포스트 내용 */}
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {/* Giscus 댓글 */}
          <Giscus
            repo={process.env.NEXT_PUBLIC_GISCUS_REPO || ""}
            repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID || ""}
            categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || ""}
            theme="light"
            lang="ko"
          />
        </article>

        {/* 사이드바: 목차 */}
        {post.headings.length > 0 && (
          <aside className="lg:col-span-1">
            <TableOfContents headings={post.headings} />
          </aside>
        )}
      </div>
    </div>
    </>
  );
}

