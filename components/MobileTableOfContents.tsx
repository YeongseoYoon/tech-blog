"use client";

import { useState, useEffect, useRef } from "react";
import { Heading } from "@/lib/mdParser";

interface MobileTableOfContentsProps {
  headings: Heading[];
}

export default function MobileTableOfContents({
  headings,
}: MobileTableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const savedScrollY = useRef<number>(0);
  const targetScrollId = useRef<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // 스크롤이 200px 이상 내려가면 버튼 표시
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // 초기 체크

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 바텀시트 열릴 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      savedScrollY.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // 목표 위치로 이동해야 하는 경우
      if (targetScrollId.current) {
        const id = targetScrollId.current;
        targetScrollId.current = null;

        // body 스타일 해제 전에 목표 위치 계산
        const element = document.getElementById(id);
        if (element) {
          // body가 fixed 상태일 때도 offsetTop은 정확한 값을 반환
          const elementTop = element.offsetTop;
          const offset = 84;
          const targetPosition = Math.max(0, elementTop - offset);

          // body 스타일 해제 (자동으로 스크롤 위치 복원됨)
          document.body.style.position = "";
          document.body.style.top = "";
          document.body.style.width = "";
          document.body.style.overflow = "";

          // body 스타일 해제 후 바로 목표 위치로 이동
          // 약간의 지연을 주어 DOM 업데이트 완료 대기
          setTimeout(() => {
            window.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });
          }, 10);
        } else {
          // 요소를 찾지 못한 경우 일반 복원
          document.body.style.position = "";
          document.body.style.top = "";
          document.body.style.width = "";
          document.body.style.overflow = "";
          window.scrollTo(0, savedScrollY.current);
        }
      } else {
        // 일반 닫기: 스크롤 위치만 복원
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, savedScrollY.current);
      }
    }
  }, [isOpen]);

  const handleClick = (id: string) => {
    // 목표 위치 저장
    targetScrollId.current = id;
    // 바텀시트 닫기 (useEffect에서 처리)
    setIsOpen(false);
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      {isVisible && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-gray-200 dark:border-gray-700"
          aria-label="목차"
        >
          <svg
            className={`w-6 h-6 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* 목차 모달 */}
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* 목차 패널 */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                목차
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="닫기"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <ul className="space-y-2">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <button
                      onClick={() => handleClick(heading.id)}
                      className="block text-left w-full text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
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
          </div>
        </>
      )}
    </>
  );
}
