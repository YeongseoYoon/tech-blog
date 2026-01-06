import { getAllPosts } from '@/lib/mdParser';
import { generateRssFeed } from '@/lib/rss';

// Revalidate feed every hour (matching homepage ISR strategy)
export const revalidate = 3600;

export async function GET() {
  try {
    // Get site URL from environment variable
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Warn if NEXT_PUBLIC_SITE_URL is not set in production
    if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === 'production') {
      console.warn('Warning: NEXT_PUBLIC_SITE_URL is not set. Using localhost as fallback.');
    }

    // Get all posts from markdown files
    const posts = await getAllPosts();

    // Generate RSS feed XML
    const rss = generateRssFeed(posts, siteUrl);

    // Return RSS feed with proper headers
    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
