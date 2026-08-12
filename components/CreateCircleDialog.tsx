'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCircle } from '@/app/actions/circles';
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('eventId', eventId);

    const result = await createCircle(formData);

    if (result.ok) {
      setIsOpen(false);
      router.refresh();
      setIsLoading(false);
    } else {
      setError(result.error || 'サークルの追加に失敗しました');
      setIsLoading(false);
    }
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
                disabled={isLoading}
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
                disabled={isLoading}
                className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="twitterId" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                X / Twitter ID
              </Label>
              <Input
                id="twitterId"
                name="twitterId"
                type="text"
                placeholder="例: @circle_account"
                disabled={isLoading}
                className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
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
                disabled={isLoading}
                rows={3}
                className="border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              disabled={isLoading}
              onClick={() => setIsOpen(false)}
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
              追加する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
