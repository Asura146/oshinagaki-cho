'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { toggleAllItemsInCircle } from '@/app/actions/items';
import { MapPin, AtSign, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Loader2, ZoomIn } from 'lucide-react';
import { CircleActionMenu } from '@/components/CircleActionMenu';
import { CreateItemDialog } from '@/components/CreateItemDialog';
import { ItemRow } from '@/components/ItemRow';
import { OshinagakiGallery } from '@/components/OshinagakiGallery';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface CircleCardProps {
  circle: {
    id: string;
    name: string;
    space: string | null;
    twitterId: string | null;
    memo: string | null;
    avatarPath: string | null;
    priority?: string | null;
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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isMoving?: boolean;
  onLongPress?: () => void;
  onItemsChange?: (items: Array<any>) => void;
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

export function CircleCard({
  circle,
  eventId,
  items,
  images,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isMoving,
  onLongPress,
  onItemsChange,
}: CircleCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [showNoImageAlert, setShowNoImageAlert] = useState(false);

  const handleOpenImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (images && images.length > 0) {
      setPreviewImageIndex(0);
    } else {
      setShowNoImageAlert(true);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewImageIndex !== null && images.length > 0) {
      setPreviewImageIndex((previewImageIndex + 1) % images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewImageIndex !== null && images.length > 0) {
      setPreviewImageIndex((previewImageIndex - 1 + images.length) % images.length);
    }
  };

  // 楽観的UI管理用
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const updateLocalItems = (newItems: typeof items) => {
    setLocalItems(newItems);
    if (onItemsChange) {
      onItemsChange(newItems);
    }
  };

  const totalCount = localItems.length;
  const checkedCount = localItems.filter((i) => i.checked).length;
  const isAllChecked = totalCount > 0 && checkedCount === totalCount;

  // サークル一括チェックの切り替え
  const handleCircleCheckToggle = () => {
    if (totalCount === 0) return;
    const previous = localItems;
    const targetChecked = !isAllChecked;
    const updated = previous.map((item) => ({ ...item, checked: targetChecked }));

    // 1. 即座に (0ms) 全ローカルアイテムの checked 状態を一括更新 ＆ 親へ通知
    updateLocalItems(updated);

    // 2. バックグラウンドでサーバー同期
    startTransition(async () => {
      const result = await toggleAllItemsInCircle(circle.id, eventId, targetChecked);
      if (!result.ok) {
        updateLocalItems(previous);
        alert(result.error || '一括状態更新に失敗しました');
      }
    });
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-200',
        isAllChecked && 'bg-zinc-200 dark:bg-zinc-950/40'
      )}
    >
      {/* サークルヘッダー (全体クリックで展開・折りたたみ) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-start justify-between p-3.5 sm:p-5 pb-3 select-none gap-1 sm:gap-2 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 pr-1">
          {/* サークル一括チェックボックス ＆ お品書き画像拡大ボタン */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-0.5 flex flex-col items-center gap-1.5 flex-shrink-0"
          >
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

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleOpenImage}
              title={images && images.length > 0 ? 'お品書き画像を拡大' : 'お品書き画像なし'}
              className="h-7 w-7 rounded-md p-0  text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900  dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 cursor-pointer transition-colors mt-0.5"
            >
              <ZoomIn className="h-4.5 w-4.5" />
            </Button>
          </div>

          {circle.avatarPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={circle.avatarPath}
              alt={circle.name}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0 mt-0.5"
            />
          ) : (
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 font-semibold text-xs flex-shrink-0 border border-zinc-200 dark:border-zinc-700 mt-0.5">
              {circle.name.substring(0, 1)}
            </div>
          )}

          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {circle.space && (
                <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-100 px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <MapPin className="mr-0.5 sm:mr-1 h-3 w-3" />
                  {circle.space}
                </span>
              )}

              {/* 優先度バッジ */}
              {circle.priority === 'high' && (
                <span className="inline-flex items-center rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
                  高
                </span>
              )}
              {circle.priority === 'low' && (
                <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  低
                </span>
              )}
              {(!circle.priority || circle.priority === 'medium') && (
                <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400">
                  中
                </span>
              )}

              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
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
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
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

        {/* 右側アクション & サマリー & 順序変更 & 開閉トグル */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {totalCount > 0 && (
            <span
              className={cn(
                'text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full border transition-colors mr-0.5',
                isAllChecked
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
              )}
            >
              {checkedCount}/{totalCount}完了
            </span>
          )}

          {onMoveUp && onMoveDown && (
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={isFirst || isMoving}
                onClick={onMoveUp}
                className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                title="上へ移動"
              >
                {isMoving ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={isLast || isMoving}
                onClick={onMoveDown}
                className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                title="下へ移動"
              >
                {isMoving ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </Button>
            </div>
          )}

          <CircleActionMenu circle={circle} eventId={eventId} />

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 cursor-pointer"
            title={isOpen ? '折りたたむ' : '展開する'}
          >
            {isOpen ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </Button>
        </div>
      </div>

      {/* 開閉コンテンツエリア */}
      {isOpen && (
        <div className="px-3.5 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          {/* アイテムリスト */}
          <div className="mt-2">
            {localItems.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {localItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    eventId={eventId}
                    onToggle={(nextChecked) => {
                      const updated = localItems.map((i) =>
                        i.id === item.id ? { ...i, checked: nextChecked } : i
                      );
                      updateLocalItems(updated);
                    }}
                  />
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

      {/* お品書き画像長押し拡大モーダル */}
      <Dialog
        open={previewImageIndex !== null}
        onOpenChange={(open) => !open && setPreviewImageIndex(null)}
      >
        <DialogContent className="max-w-4xl sm:max-w-5xl lg:max-w-6xl w-[calc(100vw-2rem)] sm:w-[95vw] p-2 border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/95 backdrop-blur shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{circle.name} のお品書き画像</DialogTitle>
          </DialogHeader>
          {previewImageIndex !== null && images[previewImageIndex] && (
            <div className="relative flex items-center justify-center max-h-[88vh] w-full overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[previewImageIndex].storagePath}
                alt={`${circle.name}のお品書き`}
                className="max-h-[85vh] max-w-full w-auto h-auto object-contain rounded"
              />

              {/* 複数枚の場合の前へ・次へボタン */}
              {images.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white h-9 w-9"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white h-9 w-9"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                    {previewImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* お品書き画像未登録時の案内モーダル */}
      <AlertDialog open={showNoImageAlert} onOpenChange={setShowNoImageAlert}>
        <AlertDialogContent className="max-w-sm border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              お品書き画像がありません
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {circle.name} にはお品書き画像がまだ登録されていません。カードを展開して画像を追加できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowNoImageAlert(false)}
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold cursor-pointer"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
