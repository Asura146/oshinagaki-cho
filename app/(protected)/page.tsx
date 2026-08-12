import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LogOut, Plus, Calendar, FileText } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name || user?.email || 'ゲストユーザー';
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Drizzleでログイン中のユーザーに関連するイベント一覧を取得
  const userEvents = user
    ? await db
        .select()
        .from(events)
        .where(eq(events.userId, user.id))
        .orderBy(desc(events.createdAt))
    : [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          
          {/* ユーザープロフィールヘッダー */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-6 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-800">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={fullName}
                    width={44}
                    height={44}
                    className="rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {fullName.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-left">
                <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {fullName}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {user?.email}
                </p>
              </div>
            </div>

            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                title="ログアウト"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* コンテンツエリア */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                イベント一覧
              </h2>
              <Button
                size="sm"
                className="bg-zinc-900 text-white hover:bg-zinc-850 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                asChild
              >
                <Link href="/events/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  イベントを作成
                </Link>
              </Button>
            </div>

            {/* イベントリスト */}
            {userEvents.length > 0 ? (
              <div className="divide-y divide-zinc-100 border-y border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
                {userEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col py-4 text-left first:pt-3 last:pb-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {event.name}
                        </h3>
                        {event.memo && (
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
                            {event.memo}
                          </p>
                        )}
                      </div>
                      {event.eventDate && (
                        <div className="flex flex-shrink-0 items-center text-xs text-zinc-500 dark:text-zinc-400">
                          <Calendar className="mr-1 h-3.5 w-3.5" />
                          <span>{event.eventDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
                <FileText className="mx-auto h-8 w-8 text-zinc-400" />
                <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  登録されたイベントはありません
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  「イベントを作成」ボタンから新しく作成してください。
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
