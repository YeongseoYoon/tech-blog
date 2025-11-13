"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/lib/mdParser";

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 스크롤 애니메이션 중일 때는 activeId 변경 안 함
          if (entry.isIntersecting && !isScrolling) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    // 모든 제목 요소 관찰
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings, isScrolling]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setIsScrolling(true);
      setActiveId(id);
      element.scrollIntoView({ behavior: "smooth" });

      // 스크롤 애니메이션 완료 후 플래그 해제 (smooth scroll 시간: ~900ms)
      setTimeout(() => {
        setIsScrolling(false);
      }, 900);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="toc">
      <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">
        목차
      </h3>
      <ul className="space-y-0">
        {headings.map((heading) => (
          <li key={heading.id} className={`toc-level-${heading.level}`}>
            <button
              onClick={() => handleClick(heading.id)}
              className={`block text-left transition ${
                activeId === heading.id ? "toc a.active" : "toc a"
              }`}
              style={{
                paddingLeft: `${(heading.level - 1) * 1}rem`,
              }}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
