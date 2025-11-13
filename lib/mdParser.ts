import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import { slug } from "github-slugger";

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

const POSTS_DIR = path.join(process.cwd(), "posts");

// HTML 엔티티 디코딩
function decodeHtmlEntities(text: string): string {
  // 숫자 엔티티 처리 (&#x3C;, &#60; 등)
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  // 일반 엔티티 처리
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// 모든 마크다운 파일 가져오기
export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(POSTS_DIR);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
      .map((file) => {
        const slug = file.replace(/\.(md|mdx)$/, "");
        return getPostBySlug(slug);
      })
  );

  return posts
    .filter((post) => post !== null)
    .sort(
      (a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()
    ) as Post[];
}

// 슬러그로 포스트 가져오기
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    // .md 파일 먼저 시도, 없으면 .mdx 파일 시도
    let filePath = path.join(POSTS_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(POSTS_DIR, `${slug}.mdx`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
    }
    const fileContents = fs.readFileSync(filePath, "utf8");

    const { data, content } = matter(fileContents);

    // 마크다운을 HTML로 변환 (마크다운 파일에 &lt; &gt;가 있으면 그대로 파싱)
    const html = await markdownToHtml(content);
    // 실제 HTML에서 생성된 ID를 추출하여 목차 생성
    const headings = await extractHeadingsFromHtml(html);

    // 디버깅: NonNullable<T> 같은 제목이 있는지 확인
    if (slug === "make-utility-types") {
      // NonNullable<T> 제목 찾기
      const nonNullableMatch = html.match(/<h2[^>]*>.*?NonNullable.*?<\/h2>/);
      if (nonNullableMatch) {
        console.log("Found NonNullable heading in HTML:", nonNullableMatch[0]);
        const extracted = headings.find((h) => h.text.includes("NonNullable"));
        if (extracted) {
          console.log("Extracted NonNullable heading:", extracted);
        } else {
          console.log(
            "All extracted headings:",
            headings.map((h) => ({ id: h.id, text: h.text }))
          );
        }
      } else {
        console.log("Could not find NonNullable heading in HTML");
        // 모든 h2 태그 찾기
        const allH2 = html.match(/<h2[^>]*>.*?<\/h2>/g);
        if (allH2) {
          console.log("All h2 tags:", allH2.slice(0, 5));
        }
      }
    }

    return {
      slug,
      title: data.title || "",
      date: data.date || "",
      summary: data.summary || "",
      tags: data.tags || [],
      featured: data.featured || false,
      content,
      html,
      headings,
    };
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}

// 마크다운을 HTML로 변환
export async function markdownToHtml(markdown: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm) // GitHub Flavored Markdown 지원 (URL 자동 링크 변환 포함)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug) // 제목에 ID 자동 추가 (rehype 단계에서 실행)
    .use(rehypeHighlight)
    .use(rehypeStringify);

  const result = await processor.process(markdown);
  let html = String(result);

  // 제목 태그 안의 HTML 엔티티를 디코딩 (제목 안의 < > 기호가 엔티티로 변환되는 것을 방지)
  // 각 레벨별로 처리하여 더 정확하게 매칭
  // 제목 안에 다른 태그가 있을 수 있으므로 더 견고한 정규식 사용
  for (let level = 1; level <= 6; level++) {
    const regex = new RegExp(`<h${level}([^>]*)>([\\s\\S]*?)</h${level}>`, "g");
    html = html.replace(regex, (match, attrs, content) => {
      // HTML 엔티티 디코딩 (&amp;를 먼저 처리해야 함)
      let decodedContent = content;
      // 여러 번 반복하여 중첩된 엔티티도 처리
      let prevContent = "";
      while (prevContent !== decodedContent) {
        prevContent = decodedContent;
        decodedContent = decodedContent
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
      }
      return `<h${level}${attrs}>${decodedContent}</h${level}>`;
    });
  }

  return html;
}

// HTML에서 제목과 ID 추출
async function extractHeadingsFromHtml(html: string): Promise<Heading[]> {
  try {
    const headings: Heading[] = [];

    // 정규식으로 h1-h4 태그에서 ID와 텍스트 추출
    // ID 속성이 있을 수도 있고 없을 수도 있으므로 두 가지 패턴 사용
    const headingRegexWithId =
      /<h([1-4])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h[1-4]>/gs;
    const headingRegexWithoutId = /<h([1-4])[^>]*>(.*?)<\/h[1-4]>/gs;

    // 먼저 ID가 있는 헤딩 추출
    let match;
    const processedTexts = new Set<string>();

    while ((match = headingRegexWithId.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const id = match[2];
      // HTML 태그 제거하고 텍스트만 추출
      let text = match[3].replace(/<[^>]*>/g, "").trim();
      // HTML 엔티티 디코딩
      text = decodeHtmlEntities(text);

      if (text && level <= 4) {
        headings.push({ id, level, text });
        processedTexts.add(text);
      }
    }

    // ID가 없는 헤딩도 처리 (rehype-slug가 ID를 생성하지 않은 경우)
    headingRegexWithoutId.lastIndex = 0;
    while ((match = headingRegexWithoutId.exec(html)) !== null) {
      const level = parseInt(match[1]);
      let text = match[2].replace(/<[^>]*>/g, "").trim();
      text = decodeHtmlEntities(text);

      // 이미 처리된 헤딩인지 확인
      if (!processedTexts.has(text) && text && level <= 4) {
        // github-slugger를 사용하여 ID 생성 (rehype-slug와 동일한 로직)
        const id = slug(text);
        headings.push({ id, level, text });
        processedTexts.add(text);
      }
    }

    return headings;
  } catch (error) {
    console.error("Error extracting headings from HTML:", error);
    // 에러 발생 시 빈 배열 반환
    return [];
  }
}

// 슬러그 목록 가져오기
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => file.replace(/\.(md|mdx)$/, ""));
}
