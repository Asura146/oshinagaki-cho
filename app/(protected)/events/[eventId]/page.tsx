import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { events, circles, items, oshinagakiImages } from '@/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
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

        <CircleListContainer
          eventId={eventId}
          event={event}
          circleList={circleList}
          circleItemsMap={circleItemsMap}
          circleOshinagakiImagesMap={circleOshinagakiImagesMap}
        />
      </main>
    </div>
  );
}
