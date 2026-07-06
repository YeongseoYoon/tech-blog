import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Post, getAllPostSlugs, getPostBySlug, getAllPosts } from '@/lib/mdParser';
import { getSiteUrl, siteConfig } from '@/lib/siteConfig';
import TableOfContents from '@/components/TableOfContents';
import MobileTableOfContents from '@/components/MobileTableOfContents';
import Giscus from '@/components/Giscus';
import CodeCopyHandler from '@/components/CodeCopyHandler';
import SvgInteractiveHandler from '@/components/SvgInteractiveHandler';
import SvgPlaygroundHandler from '@/components/SvgPlaygroundHandler';
import ReadingProgress from '@/components/ReadingProgress';
import PostNavigation from '@/components/PostNavigation';

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

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다.',
    };
  }

  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/blog/${slug}`;
  // 제목 + 내용(프론트매터) 기반으로 자동 생성되는 OG 이미지.
  // 글이 수정되면 제목/날짜/태그가 반영된 새 이미지가 자동으로 생성된다.
  const ogImageUrl = `${siteUrl}/api/og/${slug}`;

  return {
    title: post.title,
    description: post.summary,
    keywords: post.tags,
    authors: [{ name: siteConfig.author }],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      url: postUrl,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      publishedTime: post.date || undefined,
      authors: [siteConfig.author],
      tags: post.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // 모든 포스트를 가져와서 이전/다음 글 찾기
  const allPosts = await getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <CodeCopyHandler />
      <SvgInteractiveHandler />
      <SvgPlaygroundHandler />
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

          {/* 모바일 목차 (플로팅 버튼) */}
          {post.headings.length > 0 && (
            <MobileTableOfContents headings={post.headings} />
          )}

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

          {/* 이전/다음 글 네비게이션 */}
          <PostNavigation prevPost={prevPost} nextPost={nextPost} />
        </article>

        {/* 사이드바: 목차 (데스크톱만 표시) */}
        {post.headings.length > 0 && (
          <aside className="hidden lg:block lg:col-span-1">
            <TableOfContents headings={post.headings} />
          </aside>
        )}
      </div>
    </div>
    </>
  );
}

