import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const [postArg, manifestArg] = process.argv.slice(2);
if (!postArg || !manifestArg) {
  console.error("사용법: npm run check:translation -- <post.md> <manifest.json>");
  process.exit(2);
}

const postPath = path.resolve(postArg);
const manifestPath = path.resolve(manifestArg);
const failures = [];
const fail = (message) => failures.push(message);

if (!fs.existsSync(postPath)) fail(`포스트를 찾을 수 없습니다: ${postArg}`);
if (!fs.existsSync(manifestPath)) fail(`manifest를 찾을 수 없습니다: ${manifestArg}`);
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exit(1);
}

const source = fs.readFileSync(postPath, "utf8");
const { data, content } = matter(source);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (!data.title?.startsWith("[번역] ")) fail('title은 "[번역] "으로 시작해야 합니다.');
if (!Array.isArray(data.tags) || !data.tags.includes("translate")) fail('tags에 "translate"가 필요합니다.');
if (!data.date || Number.isNaN(Date.parse(data.date))) fail("date는 유효한 ISO 8601 날짜여야 합니다.");
if (!manifest.permission?.confirmed) fail("전문 번역 허락 확인 기록이 필요합니다.");
if (!manifest.koreanFeArticle?.duplicateCheckedAt || !["available", "registered"].includes(manifest.koreanFeArticle?.status)) {
  fail("KFA 중복 검사 일자와 통과 상태(available 또는 registered)가 필요합니다.");
}
if (!manifest.source?.url || !manifest.source?.title || !manifest.source?.author || !manifest.sourceCheckedAt) {
  fail("manifest에 원문 URL, 제목, 저자, 확인일이 필요합니다.");
}
if (!content.includes(manifest.source.url)) fail("본문 상단에 원문 링크백이 없습니다.");
if (!content.includes("원저자") || !content.includes("번역한 글입니다")) fail("번역 사실과 원저자 크레딧이 없습니다.");
if (!content.includes(manifest.source.author) || !/원저자[\s\S]{0,1000}(?:입니다|이다)/.test(content.slice(-1600))) {
  fail("글 하단에 원저자 소개가 없습니다.");
}

const markdownUrls = [...content.matchAll(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => match[1]);
const expectedBodyUrls = manifest.contentLinks ?? [];
const actualBodyUrls = markdownUrls.filter((url) => url !== manifest.source.url && !(manifest.publicationLinks ?? []).includes(url));
const missing = expectedBodyUrls.filter((url) => !actualBodyUrls.includes(url));
const extra = actualBodyUrls.filter((url) => !expectedBodyUrls.includes(url));
const duplicates = actualBodyUrls.filter((url, index) => actualBodyUrls.indexOf(url) !== index);
if (missing.length) fail(`누락된 원문 링크: ${missing.join(", ")}`);
if (extra.length) fail(`원문에 없는 본문 링크: ${extra.join(", ")}`);
if (duplicates.length) fail(`중복된 본문 링크: ${[...new Set(duplicates)].join(", ")}`);

const images = [...content.matchAll(/<img\s+[^>]*src=["']([^"']+)["']/g)].map((match) => match[1]);
for (const image of images) {
  if (!image.startsWith("/static/images/")) fail(`외부 또는 잘못된 이미지 경로: ${image}`);
  const diskPath = path.join(process.cwd(), "public", image);
  if (!fs.existsSync(diskPath)) fail(`이미지 파일이 없습니다: ${image}`);
  if (!path.basename(image).startsWith(`${manifest.slug}-`)) fail(`이미지에 슬러그 접두사가 없습니다: ${image}`);
}
if (images.length !== (manifest.structure?.images ?? 0)) fail("manifest의 이미지 개수와 번역문이 다릅니다.");

const fencedCodeBlocks = (content.match(/^```/gm) ?? []).length / 2;
const headings = (content.match(/^#{1,6}\s+/gm) ?? []).length;
const unorderedListItems = (content.match(/^\s*[-*+]\s+/gm) ?? []).length;
const orderedListItems = (content.match(/^\s*\d+\.\s+/gm) ?? []).length;
if (fencedCodeBlocks !== (manifest.structure?.codeBlocks ?? 0)) fail("manifest의 코드 블록 개수와 번역문이 다릅니다.");
if (headings !== (manifest.structure?.headings ?? 0)) fail("manifest의 제목 개수와 번역문이 다릅니다.");
if (unorderedListItems !== (manifest.structure?.unorderedListItems ?? 0)) fail("manifest의 글머리표 항목 개수와 번역문이 다릅니다.");
if (orderedListItems !== (manifest.structure?.orderedListItems ?? 0)) fail("manifest의 번호 목록 항목 개수와 번역문이 다릅니다.");

const forbiddenTerms = manifest.forbiddenTerms ?? ["프론트엔드", "리팩토링", "코드베이스"];
for (const term of forbiddenTerms) {
  if (content.includes(term)) fail(`용어집 비선호 표기가 남아 있습니다: ${term}`);
}
for (const pattern of manifest.forbiddenPatterns ?? ["워크플로(?!우)"]) {
  if (new RegExp(pattern, "u").test(content)) fail(`용어집 비선호 패턴이 남아 있습니다: ${pattern}`);
}

if (failures.length) {
  failures.forEach((message) => console.error(`FAIL: ${message}`));
  process.exit(1);
}

console.log(`PASS: ${postArg}`);
console.log(`- 원문 본문 링크 ${actualBodyUrls.length}개 일치`);
console.log(`- 제목 ${headings}개, 글머리표 ${unorderedListItems}개, 번호 목록 ${orderedListItems}개 확인`);
console.log(`- 코드 블록 ${fencedCodeBlocks}개, 이미지 ${images.length}개 확인`);
