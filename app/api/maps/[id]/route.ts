import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eventMaps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const map = await db.query.eventMaps.findFirst({
      where: eq(eventMaps.id, id),
    });

    if (!map) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const storagePath = map.storagePath;

    // Supabase Storage から取得してプロキシする、あるいは公開URLへリダイレクトする。
    // 今回は oshinagaki バケットを使用しており、公開バケットになっている前提であれば、
    // supabase.storage.getPublicUrl() でリダイレクト可能。
    // アクセス制御が必要な場合はサーバーサイドでダウンロードして返す。
    // まずはリダイレクトで実装。

    const supabase = await createClient();
    const { data } = supabase.storage.from('oshinagaki').getPublicUrl(storagePath);

    if (data && data.publicUrl) {
      return NextResponse.redirect(data.publicUrl, 307);
    }

    return new NextResponse('Internal Server Error', { status: 500 });
  } catch (error) {
    console.error('Failed to serve event map:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
