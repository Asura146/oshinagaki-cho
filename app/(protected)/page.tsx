import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from '@/app/actions/auth';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name || user?.email || 'ゲストユーザー';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* 背景の装飾的なボケ円 */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px] dark:bg-indigo-500/5 md:h-96 md:w-96 md:blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-pink-500/10 blur-[80px] dark:bg-pink-500/5 md:h-96 md:w-96 md:blur-[120px]" />

      <main className="w-full max-w-xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-zinc-900/40 dark:backdrop-blur-xl md:p-12">
          {/* カード上部のグラデーションライン */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="flex flex-col items-center text-center">
            {/* ユーザーアバター */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[3px] shadow-lg shadow-indigo-500/10">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  width={96}
                  height={96}
                  className="rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {fullName.substring(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="mt-6 text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-indigo-200 dark:via-purple-200 dark:to-pink-200">
              おかえりなさい、{fullName} さん
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {user?.email}
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-6 dark:border-white/5 dark:bg-white/[0.02]">
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">お品書き帳ステータス</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                データベースの構築が完了し、認証連携が動作しています。現在はイベントやサークルの管理画面の作成に向けて準備が整いました。
              </p>
            </div>

            <form action={signOutAction} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
