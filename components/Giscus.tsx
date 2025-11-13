"use client";

import { useEffect, useState } from "react";

interface GiscusProps {
  repo: string;
  repoId: string;
  categoryId: string;
  mapping?: string;
  strict?: string;
  reactionsEnabled?: string;
  emitMetadata?: string;
  inputPosition?: string;
  theme?: string;
  lang?: string;
  loading?: string;
}

export default function Giscus({
  repo,
  repoId,
  categoryId,
  mapping = "pathname",
  strict = "0",
  reactionsEnabled = "1",
  emitMetadata = "0",
  inputPosition = "bottom",
  theme = "light",
  lang = "ko",
  loading = "lazy",
}: GiscusProps) {
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    // 다크모드 감지
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setCurrentTheme(isDark ? "dark" : "light");
    };

    // 초기 테마 설정
    updateTheme();

    // 다크모드 변경 감지
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // 환경 변수가 없으면 Giscus를 로드하지 않음
    if (!repo || !repoId || !categoryId) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", mapping);
    script.setAttribute("data-strict", strict);
    script.setAttribute("data-reactions-enabled", reactionsEnabled);
    script.setAttribute("data-emit-metadata", emitMetadata);
    script.setAttribute("data-input-position", inputPosition);
    script.setAttribute("data-theme", currentTheme);
    script.setAttribute("data-lang", lang);
    script.setAttribute("data-loading", loading);

    const giscusContainer = document.getElementById("giscus-container");
    if (giscusContainer) {
      giscusContainer.appendChild(script);
    }

    return () => {
      // cleanup
      const container = document.getElementById("giscus-container");
      if (container) {
        const iframe = container.querySelector("iframe");
        if (iframe) {
          iframe.remove();
        }
        // 스크립트도 제거
        const existingScript = container.querySelector(
          'script[src="https://giscus.app/client.js"]'
        );
        if (existingScript) {
          existingScript.remove();
        }
      }
    };
  }, [
    repo,
    repoId,
    categoryId,
    mapping,
    strict,
    reactionsEnabled,
    emitMetadata,
    inputPosition,
    currentTheme,
    lang,
    loading,
  ]);

  return (
    <div
      id="giscus-container"
      className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
    />
  );
}
