"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Heading } from "@/lib/mdParser";

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // 모든 헤딩 요소가 제대로 로드되었는지 확인 (초기 로드 시에만 사용)
  const areAllHeadingsLoaded = useCallback(() => {
    if (headings.length === 0) return false;

    // 모든 헤딩이 DOM에 존재하는지 확인
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (!element) {
        return false;
      }
    }

    // 첫 번째와 마지막 헤딩의 위치가 합리적인지 확인
    const firstElement = document.getElementById(headings[0].id);
    const lastElement = document.getElementById(
      headings[headings.length - 1].id
    );

    if (!firstElement || !lastElement) return false;

    // 마지막 헤딩이 첫 번째 헤딩보다 아래에 있어야 함 (또는 같을 수도 있음)
    return lastElement.offsetTop >= firstElement.offsetTop;
  }, [headings]);

  // 현재 스크롤 위치에서 가장 가까운 헤딩 찾기
  const findActiveHeading = useCallback(() => {
    if (headings.length === 0 || isScrollingRef.current) return;

    // 초기화가 완료되지 않았을 때는 리턴
    if (!isInitializedRef.current) {
      return;
    }

    // 초기화가 완료된 후에는 정상적으로 활성 헤딩 찾기
    const scrollPosition = window.scrollY + 150; // 네비게이션 바 높이 고려
    let currentActive = "";

    // 페이지 맨 위에 있으면 무조건 첫 번째 헤딩 활성화
    if (window.scrollY < 100 && headings.length > 0) {
      currentActive = headings[0].id;
    } else {
      // 모든 헤딩의 위치를 확인 (아래에서 위로)
      for (let i = headings.length - 1; i >= 0; i--) {
        const element = document.getElementById(headings[i].id);
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop - 50) {
            currentActive = headings[i].id;
            break;
          }
        }
      }
    }

    if (currentActive) {
      setActiveId((prev) => {
        if (prev !== currentActive) {
          return currentActive;
        }
        return prev;
      });
    }
  }, [headings]);

  useEffect(() => {
    isScrollingRef.current = isScrolling;
  }, [isScrolling]);

  // 초기화 로직 (한 번만 실행)
  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    // 초기에는 첫 번째 헤딩 활성화
    if (headings.length > 0 && !activeId) {
      setActiveId(headings[0].id);
    }

    // 초기 로드 시 DOM이 완전히 렌더링될 때까지 기다린 후 활성 헤딩 찾기
    const handleInitialScroll = () => {
      let attempts = 0;
      const maxAttempts = 10;

      const checkAndSetActive = () => {
        if (hasInitializedRef.current) {
          return;
        }

        attempts++;

        if (areAllHeadingsLoaded()) {
          isInitializedRef.current = true;
          hasInitializedRef.current = true;
          // 초기 로드 시에는 항상 첫 번째 헤딩 활성화 (URL 해시가 없는 경우)
          const hash = window.location.hash;
          if (!hash || hash === "") {
            setActiveId(headings[0].id);
          } else {
            const hashId = hash.substring(1);
            if (headings.some((h) => h.id === hashId)) {
              setActiveId(hashId);
            } else {
              setActiveId(headings[0].id);
            }
          }
        } else if (attempts < maxAttempts) {
          setTimeout(checkAndSetActive, 100);
        } else {
          isInitializedRef.current = true;
          hasInitializedRef.current = true;
          if (headings.length > 0) {
            setActiveId(headings[0].id);
          }
        }
      };

      setTimeout(checkAndSetActive, 100);
    };

    handleInitialScroll();
  }, [headings, activeId, areAllHeadingsLoaded]);

  // IntersectionObserver와 스크롤 리스너 설정 (headings가 변경될 때마다 재설정)
  useEffect(() => {
    if (headings.length === 0) return;

    // IntersectionObserver 설정 (초기화 완료 후에만 작동)
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current || !isInitializedRef.current) return;

        // 교차하는 요소들 중 가장 위에 있는 것 찾기
        const intersectingEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const aTop = a.boundingClientRect.top;
            const bTop = b.boundingClientRect.top;
            return aTop - bTop;
          });

        if (intersectingEntries.length > 0) {
          const topEntry = intersectingEntries[0];
          // 화면 상단 200px 이내에 있는 헤딩 활성화
          if (topEntry.boundingClientRect.top <= 200) {
            setActiveId((prev) => {
              if (prev !== topEntry.target.id) {
                return topEntry.target.id;
              }
              return prev;
            });
          }
        }
      },
      {
        rootMargin: "-100px 0px -70% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // 모든 제목 요소 관찰
    const observeHeadings = () => {
      let attempts = 0;
      const maxAttempts = 20;

      const tryObserve = () => {
        attempts++;
        let allFound = true;

        headings.forEach((heading) => {
          const element = document.getElementById(heading.id);
          if (element) {
            observer.observe(element);
          } else {
            allFound = false;
          }
        });

        // 모든 헤딩을 찾지 못했고 아직 시도 횟수가 남아있으면 재시도
        if (!allFound && attempts < maxAttempts) {
          setTimeout(tryObserve, 100);
        }
      };

      // 약간의 지연 후 관찰 시작 (DOM 렌더링 대기)
      setTimeout(tryObserve, 100);
    };

    // 초기화가 완료된 후에만 관찰 시작
    let checkInitializedInterval: NodeJS.Timeout | null = null;
    let forceObserveTimeout: NodeJS.Timeout | null = null;

    if (isInitializedRef.current) {
      observeHeadings();
    } else {
      // 초기화가 완료될 때까지 기다림
      checkInitializedInterval = setInterval(() => {
        if (isInitializedRef.current) {
          if (checkInitializedInterval) {
            clearInterval(checkInitializedInterval);
            checkInitializedInterval = null;
          }
          observeHeadings();
        }
      }, 100);

      // 최대 5초 후에는 강제로 관찰 시작
      forceObserveTimeout = setTimeout(() => {
        if (checkInitializedInterval) {
          clearInterval(checkInitializedInterval);
          checkInitializedInterval = null;
        }
        observeHeadings();
      }, 5000);
    }

    // 스크롤 이벤트 리스너 추가 (throttle 적용)
    let ticking = false;
    const handleScroll = () => {
      if (!ticking && !isScrollingRef.current && isInitializedRef.current) {
        window.requestAnimationFrame(() => {
          findActiveHeading();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (checkInitializedInterval) {
        clearInterval(checkInitializedInterval);
      }
      if (forceObserveTimeout) {
        clearTimeout(forceObserveTimeout);
      }
    };
  }, [headings, findActiveHeading]);

  const handleClick = (id: string) => {
    setIsScrolling(true);
    setActiveId(id);

    // 요소를 찾을 때까지 여러 번 시도
    const findAndScroll = (attempts = 0) => {
      // 여러 방법으로 요소 찾기 시도
      let element = document.getElementById(id);

      // ID로 찾지 못하면 다른 방법 시도
      if (!element) {
        element = document.querySelector(`[id="${id}"]`) as HTMLElement;
      }

      // 여전히 찾지 못하면 헤딩 텍스트로 찾기 시도
      if (!element) {
        const headings = document.querySelectorAll("h1, h2, h3, h4");
        headings.forEach((heading) => {
          if (heading.id === id) {
            element = heading as HTMLElement;
          }
        });
      }

      if (element) {
        // 요소가 완전히 렌더링될 때까지 약간 대기 후 위치 계산
        requestAnimationFrame(() => {
          // 요소의 절대 위치를 정확히 계산
          const elementTop = element.offsetTop;

          // 네비게이션 바 높이(64px = h-16) + 여유 공간(20px) 고려
          const offset = 84;
          let targetPosition = elementTop - offset;

          // 최대 스크롤 가능한 위치 계산
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;

          // 마지막 헤딩인지 확인 (headings 배열에서 해당 id의 인덱스 확인)
          const headingIndex = headings.findIndex((h) => h.id === id);
          const isLastHeading = headingIndex === headings.length - 1;

          // 마지막 헤딩이거나 요소가 페이지 끝에 가까우면 페이지 끝까지 스크롤
          if (
            isLastHeading ||
            elementTop + offset >=
              document.documentElement.scrollHeight - window.innerHeight
          ) {
            targetPosition = maxScroll;
          } else {
            // 일반적인 경우: offset을 고려하되 최소값은 0, 최대값은 maxScroll
            targetPosition = Math.max(0, Math.min(targetPosition, maxScroll));
          }

          // 한 번에 정확한 위치로 스크롤
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });

          // 스크롤 애니메이션 완료 후 플래그 해제
          setTimeout(() => {
            setIsScrolling(false);
          }, 1000);
        });
      } else if (attempts < 15) {
        // 요소를 찾지 못하면 더 많이 재시도 (최대 15번, DOM 렌더링 대기)
        setTimeout(() => findAndScroll(attempts + 1), 200);
      } else {
        setIsScrolling(false);
      }
    };

    findAndScroll();
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="toc">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wider">
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
