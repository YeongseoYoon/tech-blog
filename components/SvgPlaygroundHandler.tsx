'use client';

import { useEffect } from 'react';

function sanitizeSvg(code: string): string {
  let safe = code.replace(/<script[\s\S]*?<\/script>/gi, '');
  safe = safe.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
  safe = safe.replace(/javascript\s*:/gi, 'blocked:');
  return safe;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function SvgPlaygroundHandler() {
  useEffect(() => {
    const containers = document.querySelectorAll<HTMLElement>('[data-svg-playground]');
    if (containers.length === 0) return;

    // Load highlight.js dynamically
    let hljs: any = null;
    const hljsReady = Promise.all([
      import('highlight.js/lib/core'),
      import('highlight.js/lib/languages/xml'),
    ]).then(([hljsModule, xmlModule]) => {
      hljs = hljsModule.default;
      hljs.registerLanguage('xml', xmlModule.default);
    });

    const cleanups: (() => void)[] = [];

    containers.forEach((container) => {
      const textarea = container.querySelector<HTMLTextAreaElement>('[data-playground-editor]');
      const preview = container.querySelector<HTMLElement>('[data-playground-preview]');
      const highlightEl = container.querySelector<HTMLElement>('[data-playground-highlight]');
      const resetBtn = container.querySelector<HTMLButtonElement>('[data-playground-reset]');
      const template = container.querySelector<HTMLTemplateElement>('[data-playground-original]');

      if (!textarea || !preview || !highlightEl || !template) return;

      const originalCode = template.innerHTML
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

      // Save the original server-rendered highlight HTML
      const originalHighlightHtml = highlightEl.innerHTML;

      let debounceTimer: ReturnType<typeof setTimeout>;

      function updatePreview() {
        const code = textarea!.value;
        preview!.innerHTML = sanitizeSvg(code);
        // Show horizontal scrollbar only when content actually overflows
        // Animation doesn't change scrollWidth, so no flickering
        requestAnimationFrame(() => {
          if (preview!.scrollWidth > preview!.clientWidth) {
            preview!.style.overflowX = 'auto';
          } else {
            preview!.style.overflowX = 'hidden';
          }
        });
      }

      function updateHighlight() {
        const code = textarea!.value;
        if (hljs) {
          const result = hljs.highlight(code, { language: 'xml' });
          highlightEl!.innerHTML = result.value;
        } else {
          // Fallback: plain escaped text until hljs loads
          highlightEl!.innerHTML = escapeHtml(code);
        }
      }

      function syncScroll() {
        highlightEl!.scrollTop = textarea!.scrollTop;
        highlightEl!.scrollLeft = textarea!.scrollLeft;
      }

      function autoResize() {
        textarea!.style.height = 'auto';
        textarea!.style.height = textarea!.scrollHeight + 'px';
        highlightEl!.style.height = textarea!.style.height;
      }

      const handleInput = () => {
        try { updateHighlight(); } catch (_) {}
        autoResize();
        // Debounce preview — wait until user stops typing
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          try { updatePreview(); } catch (_) {}
        }, 800);
      };

      const handleScroll = () => syncScroll();

      const handleReset = () => {
        textarea!.value = originalCode;
        highlightEl!.innerHTML = originalHighlightHtml;
        updatePreview();
        autoResize();
      };

      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = textarea!.selectionStart;
          const end = textarea!.selectionEnd;
          textarea!.value =
            textarea!.value.substring(0, start) + '  ' + textarea!.value.substring(end);
          textarea!.selectionStart = textarea!.selectionEnd = start + 2;
          handleInput();
        }
      };

      textarea.addEventListener('input', handleInput);
      textarea.addEventListener('scroll', handleScroll);
      textarea.addEventListener('keydown', handleKeydown);
      if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
      }

      autoResize();

      cleanups.push(() => {
        clearTimeout(debounceTimer);
        textarea.removeEventListener('input', handleInput);
        textarea.removeEventListener('scroll', handleScroll);
        textarea.removeEventListener('keydown', handleKeydown);
        if (resetBtn) {
          resetBtn.removeEventListener('click', handleReset);
        }
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
