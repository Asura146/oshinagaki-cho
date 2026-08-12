import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name || user?.email || 'ゲストユーザー';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-md">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-center text-center">
            {/* ユーザーアバター */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-800">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  width={72}
                  height={72}
                  className="rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-xl font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {fullName.substring(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              おかえりなさい、{fullName} さん
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {user?.email}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">お品書き帳ステータス</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                データベースの構築が完了し、認証連携が動作しています。現在はイベントやサークルの管理画面の作成に向けて準備が整いました。
              </p>
            </div>

            <form action={signOutAction} className="w-full">
              <Button
                type="submit"
                variant="outline"
                className="w-full border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
