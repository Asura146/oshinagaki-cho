import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { events, circles, items, oshinagakiImages } from '@/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { ArrowLeft, Calendar, Store } from 'lucide-react';
import { CreateCircleDialog } from '@/components/CreateCircleDialog';
import { CircleListContainer } from '@/components/CircleListContainer';

interface EventDetailPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // イベント基本情報の取得
  const eventList = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, user.id)))
    .limit(1);

  if (eventList.length === 0) {
    notFound();
  }

  const event = eventList[0];

  // サークル一覧の取得 (orderIndex 昇順)
  const circleList = await db
    .select()
    .from(circles)
    .where(and(eq(circles.eventId, eventId), eq(circles.userId, user.id)))
    .orderBy(asc(circles.orderIndex), asc(circles.createdAt));

  const circleIds = circleList.map((c) => c.id);

  // アイテム一覧とお品書き画像を並列取得
  const [itemList, allOshinagakiImages] = circleIds.length > 0
    ? await Promise.all([
        db
          .select()
          .from(items)
          .where(and(inArray(items.circleId, circleIds), eq(items.userId, user.id))),
        db
          .select()
          .from(oshinagakiImages)
          .where(and(inArray(oshinagakiImages.circleId, circleIds), eq(oshinagakiImages.userId, user.id))),
      ])
    : [[], []];

  // 集計計算
  let totalBudget = 0;
  let spentBudget = 0;

  itemList.forEach((item) => {
    const itemTotal = item.price * item.qty;
    totalBudget += itemTotal;
    if (item.checked) {
      spentBudget += itemTotal;
    }
  });

  // サークルごとにアイテムとお品書き画像をグループ化
  const circleItemsMap = new Map<string, typeof itemList>();
  const circleOshinagakiImagesMap = new Map<string, typeof allOshinagakiImages>();
  circleList.forEach((c) => {
    circleItemsMap.set(c.id, []);
    circleOshinagakiImagesMap.set(c.id, []);
  });
  itemList.forEach((item) => {
    const list = circleItemsMap.get(item.circleId);
    if (list) {
      list.push(item);
    }
  });
  allOshinagakiImages.forEach((img) => {
    const list = circleOshinagakiImagesMap.get(img.circleId);
    if (list) {
      list.push(img);
    }
  });

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-6 sm:py-10 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl">
        {/* 戻るボタン */}
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          イベント一覧に戻る
        </Link>

        {/* イベントヘッダーカード */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {event.name}
            </h1>
            {event.eventDate && (
              <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                <span>開催日: {event.eventDate}</span>
              </div>
            )}
            {event.memo && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {event.memo}
              </p>
            )}
          </div>

          {/* 集計サマリー */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <div className="text-center">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                サークル数
              </span>
              <span className="mt-1 block text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {circleList.length}
              </span>
            </div>
            <div className="border-x border-zinc-200/60 text-center dark:border-zinc-800/60">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                予定合計
              </span>
              <span className="mt-1 block text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ¥{totalBudget.toLocaleString()}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                購入済み
              </span>
              <span className="mt-1 block text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ¥{spentBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* サークル・お品書きセクション */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              サークル・お品書きリスト
            </h2>
            <CreateCircleDialog eventId={eventId} />
          </div>

          {circleList.length > 0 ? (
            <CircleListContainer
              eventId={eventId}
              circleList={circleList}
              circleItemsMap={circleItemsMap}
              circleOshinagakiImagesMap={circleOshinagakiImagesMap}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
              <Store className="mx-auto h-8 w-8 text-zinc-400" />
              <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                サークルがまだ登録されていません
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                「サークルを追加」ボタンから巡回・購入予定のサークルを追加してください。
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
