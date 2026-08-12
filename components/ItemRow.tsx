'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleItemChecked, deleteItem } from '@/app/actions/items';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  item: {
    id: string;
    name: string;
    price: number;
    qty: number;
    checked: boolean;
  };
  eventId: string;
}

export function ItemRow({ item, eventId }: ItemRowProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  // 楽観的UI表示用のローカルState
  const [isChecked, setIsChecked] = useState(item.checked);

  // サーバーの item.checked が変わったら同期
  useEffect(() => {
    setIsChecked(item.checked);
  }, [item.checked]);

  const handleToggle = () => {
    const previous = isChecked;
    const next = !previous;

    // 1. 即座に (0ms) ローカルUIを反転更新
    setIsChecked(next);

    // 2. バックグラウンドでサーバーへ送信 & 画面同期
    startTransition(async () => {
      const result = await toggleItemChecked(item.id, eventId, previous);
      if (!result.ok) {
        // 通信失敗時は元の状態にロールバック
        setIsChecked(previous);
        alert(result.error || '状態の更新に失敗しました');
      } else {
        router.refresh();
      }
    });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const result = await deleteItem(item.id, eventId);
    if (result.ok) {
      setIsDeleteDialogOpen(false);
      router.refresh();
      setIsDeleting(false);
    } else {
      alert(result.error || 'アイテムの削除に失敗しました');
      setIsDeleting(false);
    }
  };

  const totalPrice = item.price * item.qty;

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between py-2 text-sm border-b border-zinc-100 last:border-0 dark:border-zinc-800/60 transition-all duration-150',
          isChecked && 'opacity-50'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleToggle}
            disabled={isDeleting}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
          />
          <span
            className={cn(
              'font-medium truncate text-zinc-800 dark:text-zinc-200 transition-all duration-150',
              isChecked && 'line-through text-zinc-400 dark:text-zinc-500'
            )}
          >
            {item.name}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <div className="text-right text-xs">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              ¥{totalPrice.toLocaleString()}
            </span>
            {item.qty > 1 && (
              <span className="ml-1 text-zinc-400">
                (¥{item.price.toLocaleString()} × {item.qty})
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isDeleting}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="h-7 w-7 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              アイテムを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              「{item.name}」をリストから削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400"
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
