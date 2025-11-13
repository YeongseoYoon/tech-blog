'use client';

import { useEffect } from 'react';

export default function CodeCopyHandler() {
  useEffect(() => {
    // 모든 pre 태그에 복사 버튼 추가
    const addCopyButtons = () => {
      const preElements = document.querySelectorAll('pre');
      
      preElements.forEach((pre) => {
        // 이미 버튼이 있으면 스킵
        if (pre.querySelector('.copy-code-btn')) {
          return;
        }

        // 복사 버튼 생성
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.type = 'button';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code');

        // 버튼 클릭 이벤트
        button.addEventListener('click', () => {
          const codeElement = pre.querySelector('code');
          if (!codeElement) return;

          // 코드 텍스트 추출
          const codeText = codeElement.innerText;

          // 클립보드에 복사
          navigator.clipboard.writeText(codeText).then(() => {
            // 버튼 상태 변경
            button.textContent = 'Copied!';
            button.classList.add('copied');

            // 2초 후 원래 상태로 복구
            setTimeout(() => {
              button.textContent = 'Copy';
              button.classList.remove('copied');
            }, 2000);
          }).catch((err) => {
            console.error('Failed to copy:', err);
          });
        });

        // pre 요소에 버튼 추가
        pre.appendChild(button);
      });
    };

    // 초기 로드 시 버튼 추가
    addCopyButtons();

    // 동적 콘텐츠 로드를 위해 MutationObserver 사용
    const observer = new MutationObserver(() => {
      addCopyButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

