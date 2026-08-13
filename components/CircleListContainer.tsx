'use client';

import { useState, useEffect, useTransition } from 'react';
import { reorderCircles } from '@/app/actions/circles';
import { CircleCard } from '@/components/CircleCard';
import { ReorderCirclesDialog } from '@/components/ReorderCirclesDialog';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Loader2, Calendar, Store } from 'lucide-react';
import { CreateCircleDialog } from '@/components/CreateCircleDialog';

interface CircleListContainerProps {
  eventId: string;
  event: {
    name: string;
    eventDate: string | null;
    memo: string | null;
  };
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
  circleItemsMap: Record<string, Array<any>>;
  circleOshinagakiImagesMap: Record<string, Array<any>>;
}

export function CircleListContainer({
  eventId,
  event,
  circleList,
  circleItemsMap,
  circleOshinagakiImagesMap,
}: CircleListContainerProps) {
  const [isPending, startTransition] = useTransition();
  const [list, setList] = useState(circleList);
  const [movingCircleId, setMovingCircleId] = useState<string | null>(null);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['high', 'medium', 'low']);
  const [hideCompleted, setHideCompleted] = useState(false);

  // リアルタイム集計用のアイテム状態
  const [itemsRecord, setItemsRecord] = useState<Record<string, Array<any>>>(circleItemsMap);

  useEffect(() => {
    setList(circleList);
    setItemsRecord(circleItemsMap);
  }, [circleList, circleItemsMap]);

  // 集計計算 (全サークルの全アイテムを走査)
  let totalBudget = 0;
  let spentBudget = 0;
  Object.values(itemsRecord || {}).forEach((items) => {
    (items || []).forEach((item) => {
      const itemTotal = item.price * item.qty;
      totalBudget += itemTotal;
      if (item.checked) {
        spentBudget += itemTotal;
      }
    });
  });

  const togglePriorityFilter = (priority: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const isCircleCompleted = (circleId: string) => {
    const items = itemsRecord[circleId] || [];
    return items.length > 0 && items.every((i) => i.checked);
  };

  const filteredList = list.filter((circle) => {
    const p = circle.priority || 'medium';
    if (!selectedPriorities.includes(p)) return false;
    if (hideCompleted && isCircleCompleted(circle.id)) return false;
    return true;
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const targetCircle = list[index];
    setMovingCircleId(targetCircle.id);

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
      }
      setMovingCircleId(null);
    });
  };

  return (
    <div className="space-y-8">
      {/* イベントヘッダーカード (基本情報 + 集計サマリー) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {event.name}
          </h1>
          {event.eventDate && (
            <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              <span>開催日: {event.eventDate}</span>
            </div>
          )}
          {event.memo && (
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {event.memo}
            </p>
          )}
        </div>

        {/* 集計サマリー (即時楽観的更新対応) */}
        <div className="mt-6 grid grid-cols-3 gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
          <div className="text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              サークル数
            </span>
            <span className="mt-1 block text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {list.length}
            </span>
          </div>
          <div className="border-x border-zinc-200/60 text-center dark:border-zinc-800/60">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              予定合計
            </span>
            <span className="mt-1 block text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ¥{totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="text-center relative">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              購入済み
              {isPending && (
                <Loader2 className="h-2.5 w-2.5 animate-spin text-emerald-600 dark:text-emerald-400" />
              )}
            </span>
            <span className="mt-1 block text-lg font-bold text-emerald-600 dark:text-emerald-400 transition-all duration-200">
              ¥{spentBudget.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* サークル・お品書きセクション */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            サークル・お品書きリスト
          </h2>
          <CreateCircleDialog eventId={eventId} />
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
            <Store className="mx-auto h-8 w-8 text-zinc-400" />
            <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              サークルがまだ登録されていません
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              「サークルを追加」ボタンから巡回・購入予定のサークルを追加してください。
            </p>
          </div>
        ) : (
          <>
            {/* ツールバー */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                  絞り込み:
                </span>
                <label className="inline-flex items-center gap-1 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                <label className="inline-flex items-center gap-1 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                <label className="inline-flex items-center gap-1 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
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

                <label className="inline-flex items-center gap-1 cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300 border-l border-zinc-200 dark:border-zinc-800 pl-2 ml-0.5">
                  <input
                    type="checkbox"
                    checked={hideCompleted}
                    onChange={(e) => setHideCompleted(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                  />
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    完了を非表示
                  </span>
                </label>
              </div>

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
                const itemsForCircle = itemsRecord[circle.id] || [];
                const imagesForCircle = circleOshinagakiImagesMap[circle.id] || [];
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
                    isMoving={movingCircleId === circle.id}
                    onItemsChange={(updatedItems) => {
                      setItemsRecord((prev) => ({
                        ...prev,
                        [circle.id]: updatedItems,
                      }));
                    }}
                  />
                );
              })
            )}
          </>
        )}
      </div>

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
