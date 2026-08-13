'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reorderCircles } from '@/app/actions/circles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GripVertical, ArrowUp, ArrowDown, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CircleItem {
  id: string;
  name: string;
  space: string | null;
  avatarPath: string | null;
  priority?: string | null;
}

interface ReorderCirclesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  circles: CircleItem[];
}

export function ReorderCirclesDialog({
  open,
  onOpenChange,
  eventId,
  circles,
}: ReorderCirclesDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<CircleItem[]>(circles);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setItems(circles);
    }
  }, [open, circles]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const orderedIds = items.map((c) => c.id);
      const result = await reorderCircles(eventId, orderedIds);
      if (result.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        alert(result.error || '順序の保存に失敗しました');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            並べ替え
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            ドラッグ＆ドロップ、または上下矢印ボタンで巡回順序を入れ替えてください。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-1.5 py-2 pr-1 my-2">
          {items.map((circle, index) => (
            <div
              key={circle.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2.5 transition-all duration-150 dark:border-zinc-800 dark:bg-zinc-950 select-none',
                draggedIndex === index && 'border-zinc-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-850 opacity-80 scale-[0.99]'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 p-0.5">
                  <GripVertical className="h-4 w-4" />
                </span>

                <span className="text-xs font-mono text-zinc-400 w-5 text-center flex-shrink-0">
                  {index + 1}
                </span>

                {circle.avatarPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={circle.avatarPath}
                    alt={circle.name}
                    className="h-6 w-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 font-semibold text-[10px] flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                    {circle.name.substring(0, 1)}
                  </div>
                )}

                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {circle.space && (
                    <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.2 text-[11px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex-shrink-0">
                      <MapPin className="mr-0.5 h-2.5 w-2.5" />
                      {circle.space}
                    </span>
                  )}

                  {circle.priority === 'high' && (
                    <span className="inline-flex items-center rounded border border-red-200 bg-red-50 px-1 py-0.2 text-[10px] font-bold text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 flex-shrink-0">
                      高
                    </span>
                  )}
                  {circle.priority === 'low' && (
                    <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-100 px-1 py-0.2 text-[10px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 flex-shrink-0">
                      低
                    </span>
                  )}
                  {(!circle.priority || circle.priority === 'medium') && (
                    <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1 py-0.2 text-[10px] font-semibold text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400 flex-shrink-0">
                      中
                    </span>
                  )}

                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {circle.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0 || isPending}
                  onClick={() => handleMove(index, 'up')}
                  className="h-6 w-6 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 disabled:opacity-20"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === items.length - 1 || isPending}
                  onClick={() => handleMove(index, 'down')}
                  className="h-6 w-6 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 disabled:opacity-20"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="bg-zinc-900 text-white hover:bg-zinc-850 text-xs dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            保存する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
