'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector('article');
      if (!article) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const articleBottom = articleTop + articleHeight;

      // 현재 스크롤 위치가 아티클 범위 내에 있는지 확인
      if (scrollTop + windowHeight < articleTop) {
        setProgress(0);
      } else if (scrollTop > articleBottom) {
        setProgress(100);
      } else {
        const scrolled = scrollTop + windowHeight - articleTop;
        const total = articleHeight;
        const percentage = Math.min(100, Math.max(0, (scrolled / total) * 100));
        setProgress(percentage);
      }
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();

    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
      <div
        className="h-full bg-blue-600 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

