'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/app/actions/events';
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

export function CreateEventDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createEvent(formData);

    if (result.ok) {
      setIsOpen(false);
      router.refresh();
      setIsLoading(false);
    } else {
      setError(result.error || 'イベントの作成に失敗しました');
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setError(null);
        }
      }}
    >
      <DialogTrigger
        className={cn(
          buttonVariants({ size: 'sm' }),
          'bg-zinc-900 text-white hover:bg-zinc-850 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer'
        )}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        イベントを作成
      </DialogTrigger>

      <DialogContent className="border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            新規イベント作成
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            参加する同人誌即売会やお買い物イベントを作成します。
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
              <Label htmlFor="name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                イベント名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="例: コミックマーケット105"
                required
                disabled={isLoading}
                className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="eventDate" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                開催日
              </Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                disabled={isLoading}
                className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memo" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                メモ
              </Label>
              <Textarea
                id="memo"
                name="memo"
                placeholder="イベントの場所や開場時間、配置などのメモ"
                disabled={isLoading}
                rows={3}
                className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 text-sm"
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
              作成する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
