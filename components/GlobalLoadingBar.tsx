'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function GlobalLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // パスや検索パラメータが変化完了したらローディング終了
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // リンククリックイベントを監視して即座に進行バーを表示
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLAnchorElement;
      if (
        target.href &&
        target.href.startsWith(window.location.origin) &&
        target.target !== '_blank' &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        if (target.pathname !== window.location.pathname) {
          setLoading(true);
        }
      }
    };

    const anchors = document.querySelectorAll('a');
    anchors.forEach((a) => a.addEventListener('click', handleAnchorClick));

    return () => {
      anchors.forEach((a) => a.removeEventListener('click', handleAnchorClick));
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 overflow-hidden bg-zinc-200/50 dark:bg-zinc-800/50 pointer-events-none">
      <div className="h-full bg-zinc-900 dark:bg-zinc-100 animate-pulse w-full origin-left transition-all duration-300" />
    </div>
  );
}
