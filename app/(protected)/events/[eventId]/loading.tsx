export default function Loading() {
  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-6 sm:py-10 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl animate-pulse space-y-6">
        {/* 戻るリンクのスケルトン */}
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />

        {/* イベントヘッダーカードのスケルトン */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-3">
            <div className="h-7 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* 集計サマリーのスケルトン */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <div className="flex flex-col items-center gap-2">
              <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-6 w-8 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="flex flex-col items-center gap-2 border-x border-zinc-200/60 dark:border-zinc-800/60">
              <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-6 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-6 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>

        {/* サークル・お品書きセクションのスケルトン */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-9 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* サークルカードのスケルトン × 2 */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-8 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                <div className="h-8 rounded bg-zinc-100 dark:bg-zinc-800/60" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
