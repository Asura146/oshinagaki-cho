'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleAllItemsInCircle } from '@/app/actions/items';
import { MapPin, AtSign, ChevronDown, ChevronUp } from 'lucide-react';
import { CircleActionMenu } from '@/components/CircleActionMenu';
import { CreateItemDialog } from '@/components/CreateItemDialog';
import { ItemRow } from '@/components/ItemRow';
import { OshinagakiGallery } from '@/components/OshinagakiGallery';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CircleCardProps {
  circle: {
    id: string;
    name: string;
    space: string | null;
    twitterId: string | null;
    memo: string | null;
    avatarPath: string | null;
  };
  eventId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
    checked: boolean;
  }>;
  images: Array<{
    id: string;
    storagePath: string;
  }>;
}

function getTwitterUrlAndHandle(input: string) {
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const handleMatch = trimmed.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
    const handle = handleMatch ? `@${handleMatch[1]}` : trimmed;
    return { url: trimmed, handle };
  }
  const cleanHandle = trimmed.replace(/^@/, '');
  return {
    url: `https://x.com/${cleanHandle}`,
    handle: `@${cleanHandle}`,
  };
}

export function CircleCard({ circle, eventId, items, images }: CircleCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [, startTransition] = useTransition();

  // 楽観的UI管理用
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const totalCount = localItems.length;
  const checkedCount = localItems.filter((i) => i.checked).length;
  const isAllChecked = totalCount > 0 && checkedCount === totalCount;

  // サークル一括チェックの切り替え
  const handleCircleCheckToggle = () => {
    if (totalCount === 0) return;
    const previous = localItems;
    const targetChecked = !isAllChecked;

    // 1. 即座に (0ms) 全ローカルアイテムの checked 状態を一括更新
    setLocalItems(previous.map((item) => ({ ...item, checked: targetChecked })));

    // 2. バックグラウンドでサーバー同期
    startTransition(async () => {
      const result = await toggleAllItemsInCircle(circle.id, eventId, targetChecked);
      if (!result.ok) {
        setLocalItems(previous);
        alert(result.error || '一括状態更新に失敗しました');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-200',
        isAllChecked && 'bg-zinc-50/70 dark:bg-zinc-950/40'
      )}
    >
      {/* サークルヘッダー */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
          {/* サークル一括チェックボックス */}
          <div className="pt-1 flex-shrink-0">
            <input
              type="checkbox"
              checked={isAllChecked}
              onChange={handleCircleCheckToggle}
              disabled={totalCount === 0}
              title={
                totalCount === 0
                  ? 'アイテムが追加されていません'
                  : isAllChecked
                  ? '一括解除'
                  : 'サークルの全アイテムを一括チェック'
              }
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer accent-zinc-900 dark:accent-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>

          {circle.avatarPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={circle.avatarPath}
              alt={circle.name}
              className="h-9 w-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0 mt-0.5"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 font-semibold text-xs flex-shrink-0 border border-zinc-200 dark:border-zinc-700 mt-0.5">
              {circle.name.substring(0, 1)}
            </div>
          )}

          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {circle.space && (
                <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <MapPin className="mr-1 h-3 w-3" />
                  {circle.space}
                </span>
              )}
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {circle.name}
              </h3>
            </div>

            {circle.twitterId && (() => {
              const { url, handle } = getTwitterUrlAndHandle(circle.twitterId);
              return (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors group/link"
                >
                  <AtSign className="mr-1 h-3 w-3 text-zinc-400 group-hover/link:text-zinc-600 dark:group-hover/link:text-zinc-300" />
                  <span className="underline-offset-2 group-hover/link:underline">{handle}</span>
                </a>
              );
            })()}

            {circle.memo && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {circle.memo}
              </p>
            )}
          </div>
        </div>

        {/* 右側アクション & サマリー & 開閉トグル */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {totalCount > 0 && (
            <span
              className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                isAllChecked
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
              )}
            >
              {checkedCount}/{totalCount}完了
            </span>
          )}

          <CircleActionMenu circle={circle} eventId={eventId} />

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsOpen(!isOpen)}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 cursor-pointer"
            title={isOpen ? '折りたたむ' : '展開する'}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 開閉コンテンツエリア */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          {/* アイテムリスト */}
          <div className="mt-2">
            {localItems.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {localItems.map((item) => (
                  <ItemRow key={item.id} item={item} eventId={eventId} />
                ))}
              </div>
            ) : (
              <p className="py-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                お品書き（アイテム）がまだ追加されていません
              </p>
            )}

            <div className="mt-3 flex justify-end">
              <CreateItemDialog circleId={circle.id} eventId={eventId} />
            </div>
          </div>

          {/* お品書き画像ギャラリー */}
          <OshinagakiGallery circleId={circle.id} eventId={eventId} images={images} />
        </div>
      )}
    </div>
  );
}
