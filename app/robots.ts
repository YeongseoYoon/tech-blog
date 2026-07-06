import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      // OG 이미지(/api/og)는 크롤러가 접근할 수 있도록 허용
      allow: ["/", "/api/og/"],
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
