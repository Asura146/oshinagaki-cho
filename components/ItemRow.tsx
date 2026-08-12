'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleItemChecked, deleteItem } from '@/app/actions/items';
import { Button } from '@/components/ui/button';
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
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    await toggleItemChecked(item.id, eventId, item.checked);
    router.refresh();
    setIsPending(false);
  };

  const handleDelete = async () => {
    if (!confirm(`「${item.name}」を削除してもよろしいですか？`)) return;
    setIsPending(true);
    await deleteItem(item.id, eventId);
    router.refresh();
    setIsPending(false);
  };

  const totalPrice = item.price * item.qty;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 text-sm border-b border-zinc-100 last:border-0 dark:border-zinc-800/60 transition-colors',
        item.checked && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={handleToggle}
          disabled={isPending}
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
        />
        <span
          className={cn(
            'font-medium truncate text-zinc-800 dark:text-zinc-200',
            item.checked && 'line-through text-zinc-400 dark:text-zinc-500'
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
          disabled={isPending}
          onClick={handleDelete}
          className="h-7 w-7 text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
