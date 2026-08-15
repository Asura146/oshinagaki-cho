'use client';

import { useState, useTransition } from 'react';
import { updateCircle, deleteCircle, toggleCircleExcluded } from '@/app/actions/circles';
import { compressImage } from '@/lib/image-compression';
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
import { MoreHorizontal, Pencil, Trash2, Loader2, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CircleActionMenuProps {
  circle: {
    id: string;
    name: string;
    space: string | null;
    twitterId: string | null;
    memo: string | null;
    avatarPath?: string | null;
    priority?: string | null;
    isExcluded?: boolean;
  };
  eventId: string;
}

export function CircleActionMenu({ circle, eventId }: CircleActionMenuProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    formData.append('id', circle.id);
    formData.append('eventId', eventId);

    const avatarFile = formData.get('avatarFile') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      try {
        const compressedAvatar = await compressImage(avatarFile, {
          maxDimension: 600,
          quality: 0.85,
          mimeType: 'image/jpeg',
        });
        formData.set('avatarFile', compressedAvatar);
      } catch (err) {
        console.warn('Avatar compression failed, using original file:', err);
      }
    }

    startTransition(async () => {
      try {
        const result = await updateCircle(formData);
        if (result.ok) {
          setIsEditDialogOpen(false);
        } else {
          setError(result.error || 'サークル情報の更新に失敗しました');
        }
      } catch {
        setError('サークル情報の更新中にエラーが発生しました');
      }
    });
  };

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      const result = await deleteCircle(circle.id, eventId);
      if (result.ok) {
        setIsDeleteDialogOpen(false);
      } else {
        alert(result.error || 'サークルの削除に失敗しました');
      }
    });
  };

  const handleToggleExclude = () => {
    startTransition(async () => {
      const result = await toggleCircleExcluded(circle.id, eventId, !circle.isExcluded);
      if (!result.ok) {
        alert(result.error || '状態の更新に失敗しました');
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
            'h-7 w-7 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer'
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <DropdownMenuItem
            onClick={() => setIsEditDialogOpen(true)}
            className="cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleExclude}
            className="cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Ban className="mr-2 h-3.5 w-3.5" />
            {circle.isExcluded ? '対象外を解除' : '対象外としてマーク'}
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

      {/* サークル編集ダイアログ */}
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
              サークル情報の編集
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              配置スペース、サークル名、X/Twitter (ID・URL)、メモを変更できます。
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
                <Label htmlFor={`circle-space-${circle.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  配置スペース
                </Label>
                <Input
                  id={`circle-space-${circle.id}`}
                  name="space"
                  type="text"
                  defaultValue={circle.space || ''}
                  placeholder="例: 東1ホール A-01a"
                  disabled={isPending}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`circle-name-${circle.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  サークル名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`circle-name-${circle.id}`}
                  name="name"
                  type="text"
                  defaultValue={circle.name}
                  required
                  disabled={isPending}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`circle-twitter-${circle.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  X / Twitter ID または URL
                </Label>
                <Input
                  id={`circle-twitter-${circle.id}`}
                  name="twitterId"
                  type="text"
                  defaultValue={circle.twitterId || ''}
                  placeholder="例: @circle_account や https://x.com/circle_account"
                  disabled={isPending}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`circle-priority-${circle.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  巡回優先度
                </Label>
                <select
                  id={`circle-priority-${circle.id}`}
                  name="priority"
                  defaultValue={circle.priority || 'medium'}
                  disabled={isPending}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  <option value="high">🔴 高（最優先）</option>
                  <option value="medium">🟡 中（通常）</option>
                  <option value="low">⚪ 低（余裕があれば）</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`circle-avatar-${circle.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  サークルアイコン画像を変更
                </Label>
                <Input
                  id={`circle-avatar-${circle.id}`}
                  name="avatarFile"
                  type="file"
                  accept="image/*"
                  disabled={isPending}
                  className="h-9 border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-950 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-zinc-100 file:text-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`circle-memo-${circle.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  メモ
                </Label>
                <Textarea
                  id={`circle-memo-${circle.id}`}
                  name="memo"
                  defaultValue={circle.memo || ''}
                  placeholder="メモを入力"
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
              サークルを削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              「{circle.name}」および登録されているすべてのアイテム情報が削除されます。この操作は取り消せません。
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
