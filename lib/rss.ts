import { Post } from './mdParser';

/**
 * Escape XML special characters in text content
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert ISO 8601 date to RFC 822 format for RSS
 * Example: "2026-01-03T11:41:07.003Z" -> "Fri, 03 Jan 2026 11:41:07 GMT"
 */
function toRFC822(isoDate: string): string {
  return new Date(isoDate).toUTCString();
}

/**
 * Convert relative URLs to absolute URLs for RSS feed
 */
function makeAbsoluteUrls(html: string, siteUrl: string): string {
  return html
    .replace(/src="\/static\//g, `src="${siteUrl}/static/`)
    .replace(/src='\/static\//g, `src='${siteUrl}/static/`)
    .replace(/href="\/blog\//g, `href="${siteUrl}/blog/`)
    .replace(/href='\/blog\//g, `href='${siteUrl}/blog/`)
    .replace(/href="\//g, `href="${siteUrl}/`)
    .replace(/href='\//g, `href='${siteUrl}/`);
}

/**
 * Generate RSS 2.0 feed XML from blog posts
 */
export function generateRssFeed(posts: Post[], siteUrl: string): string {
  const lastBuildDate = toRFC822(new Date().toISOString());

  const items = posts.map(post => {
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const htmlContent = makeAbsoluteUrls(post.html, siteUrl);

    const categories = post.tags
      .map(tag => `    <category>${escapeXml(tag)}</category>`)
      .join('\n');

    return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${postUrl}</link>
    <guid isPermaLink="true">${postUrl}</guid>
    <description><![CDATA[${post.summary}]]></description>
    <content:encoded><![CDATA[${htmlContent}]]></content:encoded>
    <pubDate>${toRFC822(post.date)}</pubDate>
${categories}
  </item>`;
  }).join('\n');

  // UTF-8 BOM for proper Korean character encoding
  return `\ufeff<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>yeongseo-blog</title>
    <description>윤영서 기술 블로그</description>
    <link>${siteUrl}</link>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>

${items}
  </channel>
</rss>`;
}
