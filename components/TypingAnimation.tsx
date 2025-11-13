"use client";

import { useEffect, useState } from "react";

interface TypingAnimationProps {
  text: string;
  speed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
  className?: string;
}

export default function TypingAnimation({
  text,
  speed = 100,
  deleteSpeed = 50,
  pauseTime = 2000,
  className = "",
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isDeleting && currentIndex < text.length) {
      // 타이핑 중
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (!isDeleting && currentIndex >= text.length) {
      // 타이핑 완료 후 잠시 대기
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseTime);

      return () => clearTimeout(timeout);
    } else if (isDeleting && displayedText.length > 0) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev.slice(0, -1));
      }, deleteSpeed);

      return () => clearTimeout(timeout);
    } else if (isDeleting && displayedText.length === 0) {
      // 삭제 완료 후 다시 시작
      setIsDeleting(false);
      setCurrentIndex(0);
    }
  }, [
    currentIndex,
    displayedText,
    isDeleting,
    text,
    speed,
    deleteSpeed,
    pauseTime,
  ]);

  return (
    <div className={className}>
      <span className="text-gray-900 dark:text-gray-100">
        {displayedText}
        <span className="inline-block w-0.5 h-6 bg-gray-900 dark:bg-gray-100 ml-1 align-middle typing-cursor">
          |
        </span>
      </span>
    </div>
  );
}
