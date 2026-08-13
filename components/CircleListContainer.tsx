'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reorderCircles } from '@/app/actions/circles';
import { CircleCard } from '@/components/CircleCard';
import { ReorderCirclesDialog } from '@/components/ReorderCirclesDialog';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

interface CircleListContainerProps {
  eventId: string;
  circleList: Array<{
    id: string;
    name: string;
    space: string | null;
    twitterId: string | null;
    memo: string | null;
    avatarPath: string | null;
    priority?: string | null;
    orderIndex: number;
  }>;
  circleItemsMap: Map<string, Array<any>>;
  circleOshinagakiImagesMap: Map<string, Array<any>>;
}

export function CircleListContainer({
  eventId,
  circleList,
  circleItemsMap,
  circleOshinagakiImagesMap,
}: CircleListContainerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [list, setList] = useState(circleList);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['high', 'medium', 'low']);

  useEffect(() => {
    setList(circleList);
  }, [circleList]);

  const togglePriorityFilter = (priority: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const filteredList = list.filter((circle) => {
    const p = circle.priority || 'medium';
    return selectedPriorities.includes(p);
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const previousList = [...list];
    const newList = [...list];

    // 要素をスワップ
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    // 1. 即座に (0ms) 楽観的更新
    setList(newList);

    // 2. バックグラウンドで DB 保存
    const orderedIds = newList.map((c) => c.id);
    startTransition(async () => {
      const result = await reorderCircles(eventId, orderedIds);
      if (!result.ok) {
        setList(previousList);
        alert(result.error || '順序の変更に失敗しました');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 絞り込みフィルター＆並べ替えツールバー */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* 優先順位フィルターチェックボックス */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            絞り込み:
          </span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={selectedPriorities.includes('high')}
              onChange={() => togglePriorityFilter('high')}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-red-600 focus:ring-red-500 accent-red-500 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
            />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              高
            </span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={selectedPriorities.includes('medium')}
              onChange={() => togglePriorityFilter('medium')}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-amber-500 focus:ring-amber-500 accent-amber-300 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
            />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              中
            </span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={selectedPriorities.includes('low')}
              onChange={() => togglePriorityFilter('low')}
              className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-500 focus:ring-zinc-500 accent-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
            />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              低
            </span>
          </label>
        </div>

        {/* 順序変更ボタン */}
        {list.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setIsReorderOpen(true)}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
          >
            <ArrowUpDown className="mr-1 h-3 w-3" />
            並べ替え
          </Button>
        )}
      </div>

      {/* サークルカード一覧 */}
      {filteredList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            選択した優先度のサークルはありません
          </p>
        </div>
      ) : (
        filteredList.map((circle) => {
          const originalIndex = list.findIndex((c) => c.id === circle.id);
          const itemsForCircle = circleItemsMap.get(circle.id) || [];
          const imagesForCircle = circleOshinagakiImagesMap.get(circle.id) || [];
          return (
            <CircleCard
              key={circle.id}
              circle={circle}
              eventId={eventId}
              items={itemsForCircle}
              images={imagesForCircle}
              onMoveUp={() => handleMove(originalIndex, 'up')}
              onMoveDown={() => handleMove(originalIndex, 'down')}
              isFirst={originalIndex === 0}
              isLast={originalIndex === list.length - 1}
              onLongPress={() => setIsReorderOpen(true)}
            />
          );
        })
      )}

      {/* 長押し・ボタン起動の並べ替え専用モーダル */}
      <ReorderCirclesDialog
        open={isReorderOpen}
        onOpenChange={setIsReorderOpen}
        eventId={eventId}
        circles={list}
      />
    </div>
  );
}
