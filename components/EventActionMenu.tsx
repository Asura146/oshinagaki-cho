'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateEvent, deleteEvent } from '@/app/actions/events';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventActionMenuProps {
  event: {
    id: string;
    name: string;
    eventDate: string | null;
    memo: string | null;
  };
}

export function EventActionMenu({ event }: EventActionMenuProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 編集フォームの送信
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('id', event.id);

    startTransition(async () => {
      const result = await updateEvent(formData);
      if (result.ok) {
        setIsEditDialogOpen(false);
        router.refresh();
      } else {
        setError(result.error || 'イベントの更新に失敗しました');
      }
    });
  };

  // 削除の実行
  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const result = await deleteEvent(event.id);
      if (result.ok) {
        setIsDeleteDialogOpen(false);
        router.refresh();
      } else {
        alert(result.error || 'イベントの削除に失敗しました');
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
            'h-8 w-8 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer'
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">メニューを開く</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <DropdownMenuItem
            onClick={() => setIsEditDialogOpen(true)}
            className="cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="cursor-pointer text-xs font-medium text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950/30"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 編集ダイアログ */}
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
              イベントの編集
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              イベント名、開催日、メモを変更できます。
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
                <Label htmlFor={`edit-name-${event.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  イベント名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`edit-name-${event.id}`}
                  name="name"
                  type="text"
                  defaultValue={event.name}
                  required
                  disabled={isPending}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-date-${event.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  開催日
                </Label>
                <Input
                  id={`edit-date-${event.id}`}
                  name="eventDate"
                  type="date"
                  defaultValue={event.eventDate || ''}
                  disabled={isPending}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`edit-memo-${event.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  メモ
                </Label>
                <Textarea
                  id={`edit-memo-${event.id}`}
                  name="memo"
                  defaultValue={event.memo || ''}
                  disabled={isPending}
                  rows={3}
                  className="border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => setIsEditDialogOpen(false)}
                className="text-zinc-500 dark:text-zinc-400"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-zinc-900 text-white hover:bg-zinc-850 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              イベントを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              「{event.name}」を削除すると、登録されているサークルやお品書き情報も削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <AlertDialogCancel
              disabled={isPending}
              className="border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400"
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
