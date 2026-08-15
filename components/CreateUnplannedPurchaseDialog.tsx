'use client';

import { useState, useTransition } from 'react';
import { createUnplannedPurchase } from '@/app/actions/unplanned-purchases';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, ShoppingBag, Plus, Minus } from 'lucide-react';

interface CreateUnplannedPurchaseDialogProps {
  eventId: string;
  trigger?: React.ReactNode;
  onCreated?: (item: {
    id: string;
    eventId: string;
    userId: string;
    name: string;
    price: number;
    qty: number;
    circleName: string | null;
    memo: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) => void;
}

const QUICK_TAGS = ['新刊', '既刊', 'グッズ', '新刊セット', 'アクスタ', '差し入れ'];
const QUICK_PRICES = [500, 1000, 1500, 2000, 3000, 5000];

export function CreateUnplannedPurchaseDialog({
  eventId,
  trigger,
  onCreated,
}: CreateUnplannedPurchaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState(1);
  const [circleName, setCircleName] = useState('');
  const [memo, setMemo] = useState('');

  const resetForm = () => {
    setName('');
    setPrice('');
    setQty(1);
    setCircleName('');
    setMemo('');
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleTagClick = (tag: string) => {
    setName((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const handlePriceChipClick = (amount: number) => {
    setPrice(amount.toString());
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = parseInt(price, 10) || 0;
    if (!name.trim()) {
      setError('品名を入力してください');
      return;
    }

    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('name', name.trim());
    formData.append('price', parsedPrice.toString());
    formData.append('qty', qty.toString());
    if (circleName.trim()) formData.append('circleName', circleName.trim());
    if (memo.trim()) formData.append('memo', memo.trim());

    // 楽観的UI作成
    const tempId = crypto.randomUUID();
    const optimisticItem = {
      id: tempId,
      eventId,
      userId: '',
      name: name.trim(),
      price: parsedPrice,
      qty,
      circleName: circleName.trim() || null,
      memo: memo.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (onCreated) {
      onCreated(optimisticItem);
    }
    setIsOpen(false);
    resetForm();

    startTransition(async () => {
      const result = await createUnplannedPurchase(formData);
      if (!result.ok) {
        alert(result.error || '予定外購入の追加に失敗しました');
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger className="inline-flex cursor-pointer">
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger
          className={cn(
            buttonVariants({ size: 'sm', variant: 'outline' }),
            'border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50 cursor-pointer shadow-xs text-xs font-semibold'
          )}
        >
          <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          突発購入を記録
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                予定外の購入（突発購入）を記録
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                会場で見つけて購入した作品やグッズを素早く記録できます。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* 品名入力 & クイックタグ */}
          <div className="space-y-1.5">
            <Label htmlFor="unplanned-name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              品名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unplanned-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 新刊セット、アクリルスタンド"
              required
              disabled={isPending}
              autoFocus
              className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            />
            {/* クイックタグ */}
            <div className="flex flex-wrap gap-1 pt-1">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* 金額 & クイックチップ */}
          <div className="space-y-1.5">
            <Label htmlFor="unplanned-price" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              金額 (円) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                ¥
              </span>
              <Input
                id="unplanned-price"
                type="number"
                inputMode="numeric"
                min="0"
                step="50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1000"
                required
                disabled={isPending}
                className="h-9 pl-7 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 font-semibold"
              />
            </div>
            {/* クイック金額チップ */}
            <div className="flex flex-wrap gap-1 pt-1">
              {QUICK_PRICES.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePriceChipClick(amt)}
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors',
                    price === amt.toString()
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  )}
                >
                  ¥{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 数量 & サークル名（横並び） */}
          <div className="grid grid-cols-3 gap-3">
            {/* 数量 */}
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                数量
              </Label>
              <div className="flex items-center rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 h-9 px-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1 || isPending}
                  className="h-7 w-7 flex items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex-1 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  disabled={isPending}
                  className="h-7 w-7 flex items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* サークル名・スペース (任意) */}
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="unplanned-circle" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                サークル名 / スペース <span className="text-[10px] font-normal text-zinc-400">(任意)</span>
              </Label>
              <Input
                id="unplanned-circle"
                type="text"
                value={circleName}
                onChange={(e) => setCircleName(e.target.value)}
                placeholder="例: 東1 A-01b / 〇〇本舗"
                disabled={isPending}
                className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
          </div>

          {/* メモ (任意) */}
          <div className="space-y-1.5">
            <Label htmlFor="unplanned-memo" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              メモ <span className="text-[10px] font-normal text-zinc-400">(任意)</span>
            </Label>
            <Input
              id="unplanned-memo"
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: 表紙買い、ポスター付き"
              disabled={isPending}
              className="h-8 border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
              className="text-xs text-zinc-500 dark:text-zinc-400"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold dark:bg-amber-500 dark:text-zinc-900 dark:hover:bg-amber-400"
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              購入済みとして記録
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
