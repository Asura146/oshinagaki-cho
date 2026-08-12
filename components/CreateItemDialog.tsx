'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createItem } from '@/app/actions/items';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface CreateItemDialogProps {
  circleId: string;
  eventId: string;
}

export function CreateItemDialog({ circleId, eventId }: CreateItemDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('circleId', circleId);
    formData.append('eventId', eventId);

    const result = await createItem(formData);

    if (result.ok) {
      setIsOpen(false);
      router.refresh();
      setIsLoading(false);
    } else {
      setError(result.error || 'アイテムの追加に失敗しました');
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
          buttonVariants({ variant: 'outline', size: 'xs' }),
          'border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer font-normal'
        )}
      >
        <Plus className="mr-1 h-3 w-3" />
        アイテム追加
      </DialogTrigger>

      <DialogContent className="max-w-md border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            アイテム（頒布物）の追加
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
            購入したい新刊、既刊、グッズ等の情報を入力してください。
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
                品名・誌名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="例: 新刊フルカラーイラスト集"
                required
                disabled={isLoading}
                className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  価格 (円)
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  defaultValue="1000"
                  disabled={isLoading}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qty" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  数量
                </Label>
                <Input
                  id="qty"
                  name="qty"
                  type="number"
                  min="1"
                  defaultValue="1"
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
