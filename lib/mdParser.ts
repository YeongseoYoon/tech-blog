import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import remarkFrontmatter from 'remark-frontmatter';

export interface PostMetadata {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  featured?: boolean;
  slug?: string;
}

export interface Post extends PostMetadata {
  content: string;
  html: string;
  headings: Heading[];
}

export interface Heading {
  id: string;
  level: number;
  text: string;
}

const POSTS_DIR = path.join(process.cwd(), 'posts');

// 모든 마크다운 파일 가져오기
export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(POSTS_DIR);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith('.md'))
      .map((file) => getPostBySlug(file.replace(/\.md$/, '')))
  );

  return posts
    .filter((post) => post !== null)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()) as Post[];
}

// 슬러그로 포스트 가져오기
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, 'utf8');

    const { data, content } = matter(fileContents);

    const headings = extractHeadings(content);
    const html = await markdownToHtml(content);

    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      summary: data.summary || '',
      tags: data.tags || [],
      featured: data.featured || false,
      content,
      html,
      headings,
    };
  } catch (error) {
    return null;
  }
}

// 마크다운을 HTML로 변환
export async function markdownToHtml(markdown: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(addHeadingIds)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify);

  const result = await processor.process(markdown);
  return String(result);
}

// H1-H4 태그에서 제목 추출
function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split('\n');
  const idMap = new Map<string, number>(); // ID 중복 추적

  lines.forEach((line) => {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      let id = generateHeadingId(text);

      // 중복된 ID 처리
      if (idMap.has(id)) {
        const count = idMap.get(id)!;
        idMap.set(id, count + 1);
        id = `${id}-${count + 1}`;
      } else {
        idMap.set(id, 0);
      }

      if (level <= 4) {
        headings.push({ id, level, text });
      }
    }
  });

  return headings;
}

// 제목에서 ID 생성
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// 제목에 ID 추가하는 플러그인
function addHeadingIds() {
  return (tree: any) => {
    const idMap = new Map<string, number>(); // ID 중복 추적
    
    visit(tree, 'heading', (node) => {
      if (node.children && node.children.length > 0 && node.children[0].type === 'text') {
        const text = node.children[0].value;
        let id = generateHeadingId(text);
        
        // 중복된 ID 처리
        if (idMap.has(id)) {
          const count = idMap.get(id)!;
          idMap.set(id, count + 1);
          id = `${id}-${count + 1}`;
        } else {
          idMap.set(id, 0);
        }
        
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};
        node.data.hProperties.id = id;
      }
    });
  };
}

// 슬러그 목록 가져오기
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

