'use client';

import { useState, useEffect, useTransition } from 'react';
import { toggleItemChecked, updateItem, deleteItem } from '@/app/actions/items';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Pencil, Trash2, Loader2 } from 'lucide-react';
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
  onToggle?: (nextChecked: boolean) => void;
}

export function ItemRow({ item, eventId, onToggle }: ItemRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // 楽観的UI表示用のローカルState
  const [isChecked, setIsChecked] = useState(item.checked);

  // サーバーの item.checked が変わったら同期
  // サーバーの item.checked が変わったら同期
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsChecked(item.checked);
  }, [item.checked]);

  const handleToggle = () => {
    const previous = isChecked;
    const next = !previous;

    // 1. 即座に (0ms) ローカルUIを反転更新 ＆ 親へ通知
    setIsChecked(next);
    if (onToggle) {
      onToggle(next);
    }

    // 2. バックグラウンドでサーバーへ送信 & 画面同期
    startTransition(async () => {
      const result = await toggleItemChecked(item.id, eventId, previous);
      if (!result.ok) {
        setIsChecked(previous);
        if (onToggle) {
          onToggle(previous);
        }
        alert(result.error || '状態の更新に失敗しました');
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('id', item.id);
    formData.append('eventId', eventId);

    startTransition(async () => {
      const result = await updateItem(formData);
      if (result.ok) {
        setIsEditDialogOpen(false);
        setIsLoading(false);
      } else {
        setError(result.error || 'アイテムの更新に失敗しました');
        setIsLoading(false);
      }
    });
  };

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteItem(item.id, eventId);
      if (result.ok) {
        setIsDeleteDialogOpen(false);
        setIsDeleting(false);
      } else {
        alert(result.error || 'アイテムの削除に失敗しました');
        setIsDeleting(false);
      }
    });
  };

  const totalPrice = item.price * item.qty;

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between py-2 text-sm border-b border-zinc-100 last:border-0 dark:border-zinc-800/60 transition-all duration-150 gap-1.5',
          isChecked && 'opacity-50'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleToggle}
            disabled={isDeleting || isLoading}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer accent-zinc-900 dark:accent-zinc-100 flex-shrink-0"
          />
          <span
            className={cn(
              'font-medium truncate text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 transition-all duration-150',
              isChecked && 'line-through text-zinc-400 dark:text-zinc-500'
            )}
          >
            {item.name}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-1">
          <div className="text-right text-[11px] sm:text-xs mr-0.5">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              ¥{totalPrice.toLocaleString()}
            </span>
            {item.qty > 1 && (
              <span className="ml-0.5 text-zinc-400">
                (×{item.qty})
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isDeleting || isLoading}
            onClick={() => setIsEditDialogOpen(true)}
            className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
          >
            <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isDeleting || isLoading}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </div>

      {/* アイテム編集ダイアログ */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-w-md border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              アイテム（頒布物）の編集
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              品名、価格、数量を変更できます。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor={`item-name-${item.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  品名・誌名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`item-name-${item.id}`}
                  name="name"
                  type="text"
                  defaultValue={item.name}
                  required
                  disabled={isLoading}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`item-price-${item.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    価格 (円)
                  </Label>
                  <Input
                    id={`item-price-${item.id}`}
                    name="price"
                    type="number"
                    min="0"
                    step="100"
                    defaultValue={item.price}
                    disabled={isLoading}
                    className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`item-qty-${item.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    数量
                  </Label>
                  <Input
                    id={`item-qty-${item.id}`}
                    name="qty"
                    type="number"
                    min="1"
                    defaultValue={item.qty}
                    disabled={isLoading}
                    className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading}
                onClick={() => setIsEditDialogOpen(false)}
                className="text-zinc-500 dark:text-zinc-400"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-zinc-900 text-white hover:bg-zinc-850 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                更新する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
