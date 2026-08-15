import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { events, circles, oshinagakiImages } from '@/lib/db/schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { CircleListContainer } from '@/components/CircleListContainer';
import { unplannedPurchases } from '@/lib/db/schema';

interface EventDetailPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

// データの取得とCircleListContainerの描画を担う非同期コンポーネント
async function EventDataFetcher({ eventId, userId }: { eventId: string; userId: string }) {
  const eventData = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.userId, userId)),
    with: {
      circles: {
        orderBy: [asc(circles.orderIndex), asc(circles.createdAt)],
        columns: {
          avatarPath: false,
        },
        extras: {
          hasBase64Avatar: sql<boolean>`left(${circles.avatarPath}, 5) = 'data:'`.as('has_base64_avatar'),
          avatarUrl: sql<string>`case when left(${circles.avatarPath}, 5) = 'data:' then null else ${circles.avatarPath} end`.as('avatar_url'),
        },
        with: {
          items: true,
          oshinagakiImages: {
            columns: {
              storagePath: false,
            },
            extras: {
              hasBase64Image: sql<boolean>`left(${oshinagakiImages.storagePath}, 5) = 'data:'`.as('has_base64_image'),
              storageUrl: sql<string>`case when left(${oshinagakiImages.storagePath}, 5) = 'data:' then null else ${oshinagakiImages.storagePath} end`.as('storage_url'),
            },
          },
        },
      },
      unplannedPurchases: {
        orderBy: [desc(unplannedPurchases.createdAt)],
      },
    },
  });

  if (!eventData) {
    notFound();
  }

  const { circles: fetchedCircles, unplannedPurchases: fetchedUnplannedPurchases = [], ...event } = eventData;
  const circleList = fetchedCircles.map((c) => ({
    id: c.id,
    eventId: c.eventId,
    userId: c.userId,
    name: c.name,
    twitterId: c.twitterId,
    space: c.space,
    avatarPath: c.hasBase64Avatar ? `/api/images/avatars/${c.id}` : c.avatarUrl,
    isExcluded: c.isExcluded,
    memo: c.memo,
    priority: c.priority,
    orderIndex: c.orderIndex,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  const circleItemsMap: Record<string, typeof fetchedCircles[number]['items']> = {};
  const circleOshinagakiImagesMap: Record<string, Array<{ id: string; storagePath: string; orderIndex: number; createdAt: Date }>> = {};
  
  fetchedCircles.forEach((circle) => {
    circleItemsMap[circle.id] = circle.items;
    circleOshinagakiImagesMap[circle.id] = (circle.oshinagakiImages || []).map((img) => ({
      id: img.id,
      orderIndex: img.orderIndex,
      createdAt: img.createdAt,
      storagePath: img.hasBase64Image
        ? `/api/images/oshinagaki/${img.id}`
        : img.storageUrl,
    }));
  });

  return (
    <CircleListContainer
      eventId={eventId}
      event={event}
      circleList={circleList}
      circleItemsMap={circleItemsMap}
      circleOshinagakiImagesMap={circleOshinagakiImagesMap}
      unplannedPurchases={fetchedUnplannedPurchases}
    />
  );
}

// イベント詳細ページのスケルトンローディング
function EventSkeleton() {
  return (
    <div className="animate-pulse space-y-6 w-full">
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
    </div>
  );
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

        <Suspense fallback={<EventSkeleton />}>
          <EventDataFetcher eventId={eventId} userId={user.id} />
        </Suspense>
      </main>
    </div>
  );
}
