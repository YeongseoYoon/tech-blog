import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/mdParser";
import { siteConfig } from "@/lib/siteConfig";

// fs를 사용하는 mdParser에 의존하므로 Node.js 런타임에서 실행한다.
export const runtime = "nodejs";

// 토끼 로고를 data URI로 임베드 (네트워크 없이 이미지에 삽입)
function loadLogoDataUri(): string | null {
  try {
    const logoPath = path.join(
      process.cwd(),
      "public/static/images/logo.png"
    );
    const data = fs.readFileSync(logoPath);
    return `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

// 렌더링에 필요한 글자만 담은 서브셋 폰트를 Google Fonts에서 받아온다.
// (한글은 next/og 기본 폰트로 렌더링되지 않으므로 반드시 필요)
async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(
      text
    )}`;
    const cssResponse = await fetch(url, {
      headers: {
        // 최신 브라우저 UA를 보내야 woff2 대신 ttf/otf 소스를 받을 수 있다.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
    });
    const css = await cssResponse.text();
    const resource = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/
    );
    if (!resource) return null;

    const fontResponse = await fetch(resource[1]);
    if (!fontResponse.ok) return null;
    return await fontResponse.arrayBuffer();
  } catch {
    return null;
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    const title = post.title || siteConfig.title;
    const dateLabel = formatDate(post.date);
    const tags = (post.tags || []).slice(0, 3);
    const logoSrc = loadLogoDataUri();

    // 이미지에 그려질 모든 텍스트 (폰트 서브셋 생성용)
    const usedText = [
      title,
      dateLabel,
      siteConfig.name,
      siteConfig.author,
      ...tags.map((t) => `#${t}`),
    ].join(" ");

    const [bold, regular] = await Promise.all([
      loadGoogleFont("Noto+Sans+KR", 700, usedText),
      loadGoogleFont("Noto+Sans+KR", 400, usedText),
    ]);

    const fonts = [
      bold && { name: "Noto Sans KR", data: bold, weight: 700 as const, style: "normal" as const },
      regular && { name: "Noto Sans KR", data: regular, weight: 400 as const, style: "normal" as const },
    ].filter(Boolean) as {
      name: string;
      data: ArrayBuffer;
      weight: 400 | 700;
      style: "normal";
    }[];

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(135deg, #fff7ed 0%, #ffffff 52%, #fffbeb 100%)",
            position: "relative",
            overflow: "hidden",
            fontFamily: "Noto Sans KR",
          }}
        >
          {/* 배경 장식 (로고와 어울리는 앰버 톤) */}
          <div
            style={{
              position: "absolute",
              top: -130,
              right: -110,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: "rgba(251, 146, 60, 0.14)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -170,
              left: -150,
              width: 480,
              height: 480,
              borderRadius: "50%",
              background: "rgba(245, 158, 11, 0.10)",
            }}
          />
          {/* 우하단 토끼 로고 워터마크 */}
          {logoSrc ? (
            <img
              src={logoSrc}
              width={300}
              height={300}
              style={{
                position: "absolute",
                bottom: -36,
                right: -24,
                opacity: 0.1,
              }}
            />
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              padding: "60px 80px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* 헤더: 로고 + 사이트명 / 날짜 */}
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {logoSrc ? (
                  <img src={logoSrc} width={60} height={60} />
                ) : null}
                <div style={{ fontSize: 30, fontWeight: 700, color: "#c2410c" }}>
                  {siteConfig.name}
                </div>
              </div>
              <div style={{ flex: 1 }} />
              {dateLabel ? (
                <div style={{ fontSize: 22, color: "#78716c", fontWeight: 400 }}>
                  {dateLabel}
                </div>
              ) : null}
            </div>

            {/* 제목 (좌측 앰버 액센트 바 + 타이틀) */}
            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 8,
                  height: title.length > 30 ? 200 : 120,
                  borderRadius: 999,
                  background: "linear-gradient(180deg, #fb923c 0%, #f59e0b 100%)",
                  marginRight: 32,
                }}
              />
              <div
                style={{
                  display: "flex",
                  fontSize: title.length > 30 ? 60 : 72,
                  fontWeight: 700,
                  color: "#1c1917",
                  lineHeight: 1.2,
                  letterSpacing: "-1px",
                  maxWidth: 940,
                }}
              >
                {title}
              </div>
            </div>

            {/* 푸터: 태그 + 작성자 */}
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <div style={{ display: "flex", gap: 12 }}>
                {tags.map((tag) => (
                  <div
                    key={tag}
                    style={{
                      display: "flex",
                      fontSize: 22,
                      color: "#c2410c",
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      padding: "8px 20px",
                      borderRadius: 999,
                      fontWeight: 400,
                    }}
                  >
                    #{tag}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 24, color: "#57534e", fontWeight: 700 }}>
                {siteConfig.author}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        ...(fonts.length > 0 ? { fonts } : {}),
      }
    );
  } catch (error) {
    console.error("OG 이미지 생성 실패:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
