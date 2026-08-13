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

  useEffect(() => {
    setList(circleList);
  }, [circleList]);

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
      {/* 順序変更ツールバーボタン（補足ガイド） */}
      {list.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            💡 サークルカードを長押しで順番を入れ替えられます
          </span>
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
        </div>
      )}

      {/* サークルカード一覧 */}
      {list.map((circle, index) => {
        const itemsForCircle = circleItemsMap.get(circle.id) || [];
        const imagesForCircle = circleOshinagakiImagesMap.get(circle.id) || [];
        return (
          <CircleCard
            key={circle.id}
            circle={circle}
            eventId={eventId}
            items={itemsForCircle}
            images={imagesForCircle}
            onMoveUp={() => handleMove(index, 'up')}
            onMoveDown={() => handleMove(index, 'down')}
            isFirst={index === 0}
            isLast={index === list.length - 1}
            onLongPress={() => setIsReorderOpen(true)}
          />
        );
      })}

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
