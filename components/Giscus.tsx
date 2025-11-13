'use client';

import { useEffect } from 'react';

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
  mapping = 'pathname',
  strict = '0',
  reactionsEnabled = '1',
  emitMetadata = '0',
  inputPosition = 'bottom',
  theme = 'light',
  lang = 'ko',
  loading = 'lazy',
}: GiscusProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-strict', strict);
    script.setAttribute('data-reactions-enabled', reactionsEnabled);
    script.setAttribute('data-emit-metadata', emitMetadata);
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-loading', loading);

    const giscusContainer = document.getElementById('giscus-container');
    if (giscusContainer) {
      giscusContainer.appendChild(script);
    }

    return () => {
      // cleanup
      const container = document.getElementById('giscus-container');
      if (container) {
        const iframe = container.querySelector('iframe');
        if (iframe) {
          iframe.remove();
        }
      }
    };
  }, [repo, repoId, categoryId, mapping, strict, reactionsEnabled, emitMetadata, inputPosition, theme, lang, loading]);

  return (
    <div
      id="giscus-container"
      className="mt-12 pt-8 border-t border-gray-200"
    />
  );
}

