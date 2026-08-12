import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { events, circles, items, oshinagakiImages } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { ArrowLeft, Calendar, MapPin, AtSign, Store } from 'lucide-react';
import { CreateCircleDialog } from '@/components/CreateCircleDialog';
import { CreateItemDialog } from '@/components/CreateItemDialog';
import { ItemRow } from '@/components/ItemRow';
import { CircleActionMenu } from '@/components/CircleActionMenu';
import { OshinagakiGallery } from '@/components/OshinagakiGallery';

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

  // サークル一覧の取得
  const circleList = await db
    .select()
    .from(circles)
    .where(and(eq(circles.eventId, eventId), eq(circles.userId, user.id)));

  const circleIds = circleList.map((c) => c.id);

  // アイテム一覧の取得
  const itemList =
    circleIds.length > 0
      ? await db
          .select()
          .from(items)
          .where(and(inArray(items.circleId, circleIds), eq(items.userId, user.id)))
      : [];

  // お品書き画像の取得
  const allOshinagakiImages =
    circleIds.length > 0
      ? await db
          .select()
          .from(oshinagakiImages)
          .where(and(inArray(oshinagakiImages.circleId, circleIds), eq(oshinagakiImages.userId, user.id)))
      : [];

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-zinc-950">
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
            <div className="space-y-4">
              {circleList.map((circle) => {
                const itemsForCircle = circleItemsMap.get(circle.id) || [];
                return (
                  <div
                    key={circle.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* サークルヘッダー */}
                    <div className="flex items-start justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        {circle.avatarPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={circle.avatarPath}
                            alt={circle.name}
                            className="h-9 w-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 font-semibold text-xs flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                            {circle.name.substring(0, 1)}
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {circle.space && (
                              <span className="inline-flex items-center rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <MapPin className="mr-1 h-3 w-3" />
                                {circle.space}
                              </span>
                            )}
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                              {circle.name}
                            </h3>
                          </div>
                          {circle.twitterId && (
                            <div className="flex items-center text-xs text-zinc-400 dark:text-zinc-500">
                              <AtSign className="mr-1 h-3 w-3" />
                              <span>{circle.twitterId}</span>
                            </div>
                          )}
                          {circle.memo && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {circle.memo}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <CircleActionMenu
                          circle={circle}
                          eventId={eventId}
                        />
                      </div>
                    </div>

                    {/* アイテムリスト */}
                    <div className="mt-3">
                      {itemsForCircle.length > 0 ? (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                          {itemsForCircle.map((item) => (
                            <ItemRow key={item.id} item={item} eventId={eventId} />
                          ))}
                        </div>
                      ) : (
                        <p className="py-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                          お品書き（アイテム）がまだ追加されていません
                        </p>
                      )}

                      <div className="mt-3 flex justify-end">
                        <CreateItemDialog circleId={circle.id} eventId={eventId} />
                      </div>
                    </div>

                    {/* お品書き画像ギャラリー */}
                    <OshinagakiGallery
                      circleId={circle.id}
                      eventId={eventId}
                      images={circleOshinagakiImagesMap.get(circle.id) || []}
                    />
                  </div>
                );
              })}
            </div>
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
