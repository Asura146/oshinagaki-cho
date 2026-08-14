export default function Loading() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-6 sm:py-10 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-xl animate-pulse">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* ユーザープロフィールヘッダーのスケルトン */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-6 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* コンテンツエリアのスケルトン */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-6 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-9 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* イベントリストのスケルトン × 3 */}
            <div className="divide-y divide-zinc-100 border-y border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col py-4 first:pt-3 last:pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-7 w-7 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
