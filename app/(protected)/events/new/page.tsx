'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/app/actions/events';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createEvent(formData);

    if (result.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError(result.error || 'イベントの作成に失敗しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-md">
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          ダッシュボードに戻る
        </Link>

        <Card className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              新規イベント作成
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              参加する同人誌即売会やお買い物イベントを作成します。
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">
                  イベント名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="例: コミックマーケット105"
                  required
                  disabled={isLoading}
                  className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate" className="text-zinc-700 dark:text-zinc-300">
                  開催日
                </Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  disabled={isLoading}
                  className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo" className="text-zinc-700 dark:text-zinc-300">
                  メモ
                </Label>
                <Textarea
                  id="memo"
                  name="memo"
                  placeholder="イベントの場所や開場時間、配置などのメモ"
                  disabled={isLoading}
                  rows={4}
                  className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  isLoading && 'pointer-events-none opacity-50'
                )}
              >
                キャンセル
              </Link>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-zinc-900 text-white hover:bg-zinc-850 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                作成する
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
