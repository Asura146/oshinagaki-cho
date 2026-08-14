'use client';

import { useState, useTransition } from 'react';
import { createCircle } from '@/app/actions/circles';
import { compressImage } from '@/lib/image-compression';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateCircleDialogProps {
  eventId: string;
}

export function CreateCircleDialog({ eventId }: CreateCircleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
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
        const result = await createCircle(formData);
        if (result.ok) {
          setIsOpen(false);
        } else {
          setError(result.error || 'サークルの追加に失敗しました');
        }
      } catch {
        setError('サークルの追加中にエラーが発生しました');
      }
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setError(null);
      }}
    >
      <DialogTrigger
        className={cn(
          buttonVariants({ size: 'sm' }),
          'bg-zinc-900 text-white hover:bg-zinc-850 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer'
        )}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        サークルを追加
      </DialogTrigger>

      <DialogContent className="max-w-md border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            サークルの追加
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            チェックしたいサークルの情報や配置スペースを入力してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="space" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                配置スペース
              </Label>
              <Input
                id="space"
                name="space"
                type="text"
                placeholder="例: 東1ホール A-01a"
                disabled={isPending}
                className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                サークル名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="例: おしながき本舗"
                required
                disabled={isPending}
                className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="twitterId" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                X / Twitter ID または URL
              </Label>
              <Input
                id="twitterId"
                name="twitterId"
                type="text"
                placeholder="例: @circle_account や https://x.com/circle_account"
                disabled={isPending}
                className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                巡回優先度
              </Label>
              <select
                id="priority"
                name="priority"
                defaultValue="medium"
                disabled={isPending}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="high">🔴 高（最優先）</option>
                <option value="medium">🟡 中（通常）</option>
                <option value="low">⚪ 低（余裕があれば）</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="avatarFile" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                サークルアイコン画像
              </Label>
              <Input
                id="avatarFile"
                name="avatarFile"
                type="file"
                accept="image/*"
                disabled={isPending}
                className="h-9 border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-950 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-zinc-100 file:text-zinc-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memo" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                メモ
              </Label>
              <Textarea
                id="memo"
                name="memo"
                placeholder="狙い目の作品や巡回優先度などのメモ"
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
              onClick={() => setIsOpen(false)}
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
              追加する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
