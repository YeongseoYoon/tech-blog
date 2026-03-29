'use client';

import { useEffect } from 'react';

export default function SvgInteractiveHandler() {
  useEffect(() => {
    const containers = document.querySelectorAll<HTMLElement>('[data-svg-interactive]');
    if (containers.length === 0) return;

    const cleanups: (() => void)[] = [];

    containers.forEach((container) => {
      const preview = container.querySelector('.svg-interactive-preview');
      if (!preview) return;

      const codeLines = container.querySelectorAll<HTMLElement>(
        '.code-line[data-element-id]'
      );

      function activate(elementId: string) {
        // Highlight all code lines with same element-id
        container
          .querySelectorAll(`.code-line[data-element-id="${elementId}"]`)
          .forEach((l) => l.classList.add('svg-line-active'));
        // Highlight SVG element(s)
        preview!
          .querySelectorAll(`[data-element-id="${elementId}"]`)
          .forEach((el) => el.classList.add('svg-element-active'));
        // Dim non-active elements
        preview!.classList.add('svg-has-active');
      }

      function deactivate() {
        container
          .querySelectorAll('.svg-line-active')
          .forEach((l) => l.classList.remove('svg-line-active'));
        preview!
          .querySelectorAll('.svg-element-active')
          .forEach((el) => el.classList.remove('svg-element-active'));
        preview!.classList.remove('svg-has-active');
      }

      // --- Desktop: mouseenter / mouseleave ---
      codeLines.forEach((line) => {
        const elementId = line.getAttribute('data-element-id');
        if (!elementId) return;

        const handleEnter = () => activate(elementId);
        const handleLeave = () => deactivate();

        line.addEventListener('mouseenter', handleEnter);
        line.addEventListener('mouseleave', handleLeave);

        cleanups.push(() => {
          line.removeEventListener('mouseenter', handleEnter);
          line.removeEventListener('mouseleave', handleLeave);
        });
      });

      // --- Mobile: tap to toggle ---
      let activeTouch: string | null = null;

      const handleTouch = (e: Event) => {
        const target = (e.target as HTMLElement).closest<HTMLElement>(
          '.code-line[data-element-id]'
        );

        if (!target) {
          deactivate();
          activeTouch = null;
          return;
        }

        const elementId = target.getAttribute('data-element-id');
        if (!elementId) return;

        e.preventDefault();

        if (activeTouch === elementId) {
          deactivate();
          activeTouch = null;
        } else {
          deactivate();
          activeTouch = elementId;
          activate(elementId);
        }
      };

      const codeArea = container.querySelector('.svg-interactive-code');
      if (codeArea) {
        codeArea.addEventListener('touchstart', handleTouch, { passive: false });
        cleanups.push(() =>
          codeArea.removeEventListener('touchstart', handleTouch)
        );
      }

      // Clear highlight when tapping outside the container (mobile)
      const handleOutsideTouch = (e: Event) => {
        if (!container.contains(e.target as Node)) {
          deactivate();
          activeTouch = null;
        }
      };
      document.addEventListener('touchstart', handleOutsideTouch);
      cleanups.push(() =>
        document.removeEventListener('touchstart', handleOutsideTouch)
      );
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
