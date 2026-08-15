'use client';

import { useState, useTransition } from 'react';
import { updateUnplannedPurchase, deleteUnplannedPurchase } from '@/app/actions/unplanned-purchases';
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
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  MapPin,
  Loader2,
  Plus,
} from 'lucide-react';
import { CreateUnplannedPurchaseDialog } from './CreateUnplannedPurchaseDialog';

export interface UnplannedPurchaseItem {
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
}

interface UnplannedPurchaseListProps {
  eventId: string;
  purchases: UnplannedPurchaseItem[];
  onPurchasesChange?: (items: UnplannedPurchaseItem[]) => void;
}

export function UnplannedPurchaseList({
  eventId,
  purchases,
  onPurchasesChange,
}: UnplannedPurchaseListProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingItem, setEditingItem] = useState<UnplannedPurchaseItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalCount = purchases.length;
  const totalAmount = purchases.reduce((sum, p) => sum + p.price * p.qty, 0);

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;

    const formData = new FormData(e.currentTarget);
    formData.append('id', editingItem.id);
    formData.append('eventId', eventId);

    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string, 10) || 0;
    const qty = parseInt(formData.get('qty') as string, 10) || 1;
    const circleName = (formData.get('circleName') as string) || null;
    const memo = (formData.get('memo') as string) || null;

    const updatedList = purchases.map((p) =>
      p.id === editingItem.id ? { ...p, name, price, qty, circleName, memo } : p
    );

    if (onPurchasesChange) {
      onPurchasesChange(updatedList);
    }
    setEditingItem(null);

    startTransition(async () => {
      const result = await updateUnplannedPurchase(formData);
      if (!result.ok) {
        if (onPurchasesChange) onPurchasesChange(purchases);
        alert(result.error || '更新に失敗しました');
      }
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('この予定外購入メモを削除しますか？')) return;

    const previousList = purchases;
    const updatedList = purchases.filter((p) => p.id !== id);

    if (onPurchasesChange) {
      onPurchasesChange(updatedList);
    }
    setDeletingId(id);

    startTransition(async () => {
      const result = await deleteUnplannedPurchase(id, eventId);
      if (!result.ok) {
        if (onPurchasesChange) onPurchasesChange(previousList);
        alert(result.error || '削除に失敗しました');
      }
      setDeletingId(null);
    });
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200/80 bg-amber-50/40 shadow-sm dark:border-amber-950/60 dark:bg-amber-950/20 transition-all">
      {/* ヘッダー */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3.5 sm:p-4 select-none cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-950/30 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white dark:bg-amber-600 shadow-xs flex-shrink-0">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                予定外・突発購入
              </h3>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {totalCount}点
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            ¥{totalAmount.toLocaleString()}
          </span>

          <CreateUnplannedPurchaseDialog
            eventId={eventId}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="h-7 w-7 text-amber-700 hover:bg-amber-200/60 dark:text-amber-300 dark:hover:bg-amber-900/40"
                title="突発購入を追加"
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
            onCreated={(item) => {
              if (onPurchasesChange) {
                onPurchasesChange([item, ...purchases]);
              }
            }}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsOpen(!isOpen)}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 cursor-pointer"
            title={isOpen ? '折りたたむ' : '展開する'}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* リスト展開エリア */}
      {isOpen && (
        <div className="px-3.5 sm:px-4 pb-3.5 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
          <div className="divide-y divide-amber-200/40 dark:divide-amber-900/30">
            {purchases.map((item) => {
              const itemTotal = item.price * item.qty;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 text-xs group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </span>
                      {item.qty > 1 && (
                        <span className="text-[11px] text-zinc-500 font-medium">
                          ×{item.qty}
                        </span>
                      )}
                      {item.circleName && (
                        <span className="inline-flex items-center rounded border border-amber-200/80 bg-amber-100/60 px-1.5 py-0.2 text-[10px] font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                          <MapPin className="mr-0.5 h-2.5 w-2.5" />
                          {item.circleName}
                        </span>
                      )}
                    </div>
                    {item.memo && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {item.memo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-zinc-900 dark:text-zinc-50">
                      ¥{itemTotal.toLocaleString()}
                    </span>

                    <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-amber-200/60 dark:hover:text-zinc-200 dark:hover:bg-amber-900/40 transition-colors"
                        title="編集"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === item.id || isPending}
                        onClick={(e) => handleDelete(item.id, e)}
                        className="rounded p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                        title="削除"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 編集ダイアログ */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              予定外購入の編集
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              品名、金額、サークル名、メモを変更できます。
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-unplanned-name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  品名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-unplanned-name"
                  name="name"
                  type="text"
                  defaultValue={editingItem.name}
                  required
                  disabled={isPending}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="edit-unplanned-price" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    単価 (円) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-unplanned-price"
                    name="price"
                    type="number"
                    defaultValue={editingItem.price}
                    min="0"
                    step="50"
                    required
                    disabled={isPending}
                    className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 font-semibold"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label htmlFor="edit-unplanned-qty" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    数量
                  </Label>
                  <Input
                    id="edit-unplanned-qty"
                    name="qty"
                    type="number"
                    defaultValue={editingItem.qty}
                    min="1"
                    required
                    disabled={isPending}
                    className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 font-semibold text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-unplanned-circle" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  サークル名 / スペース <span className="text-[10px] font-normal text-zinc-400">(任意)</span>
                </Label>
                <Input
                  id="edit-unplanned-circle"
                  name="circleName"
                  type="text"
                  defaultValue={editingItem.circleName || ''}
                  disabled={isPending}
                  className="h-9 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-unplanned-memo" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  メモ <span className="text-[10px] font-normal text-zinc-400">(任意)</span>
                </Label>
                <Input
                  id="edit-unplanned-memo"
                  name="memo"
                  type="text"
                  defaultValue={editingItem.memo || ''}
                  disabled={isPending}
                  className="h-8 border-zinc-200 bg-white text-xs dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <DialogFooter className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => setEditingItem(null)}
                  className="text-xs text-zinc-500 dark:text-zinc-400"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-zinc-900 text-white hover:bg-zinc-850 text-xs font-bold dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  更新する
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
