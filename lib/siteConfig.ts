// 사이트 전역 설정 (SEO / OG 태그 생성에 사용)

// 배포 환경에 맞는 사이트 URL을 반환한다.
// 우선순위: NEXT_PUBLIC_SITE_URL > Vercel 자동 주입 URL > 로컬 기본값
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export const siteConfig = {
  name: "yeongseo-blog",
  title: "윤영서 기술 블로그",
  description: "윤영서 기술 블로그",
  author: "윤영서",
  locale: "ko_KR",
} as const;
