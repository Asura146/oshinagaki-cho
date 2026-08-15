'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { eventMaps } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

const uploadMapSchema = z.object({
  eventId: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, 'マップ名は必須です'),
});

export async function uploadEventMap(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    const rawData = {
      eventId: formData.get('eventId'),
      name: formData.get('name'),
    };

    const validated = uploadMapSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues.map((e) => e.message).join(', '),
      };
    }

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return { ok: false, error: 'ファイルが選択されていません。' };
    }

    const mapId = crypto.randomUUID();
    let mimeType = file.type;
    
    // MIMEタイプの推測
    if (!mimeType || mimeType === 'application/octet-stream') {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (lowerName.endsWith('.png')) mimeType = 'image/png';
      else if (lowerName.endsWith('.webp')) mimeType = 'image/webp';
      else if (lowerName.endsWith('.gif')) mimeType = 'image/gif';
      else mimeType = 'image/jpeg'; // fallback
    }

    // 10MB制限
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: 'ファイルサイズは10MB以下にしてください。' };
    }

    // Storageにアップロード
    const fileBuffer = await file.arrayBuffer();
    const filename = `${user.id}/maps/${validated.data.eventId}_${mapId}_${Date.now()}`;
    
    // oshinagakiバケットを再利用してマップを保存（SQLで作成済みのバケット）
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('oshinagaki')
      .upload(filename, fileBuffer, { contentType: mimeType, upsert: true });

    if (uploadError || !uploadData) {
      console.error('Map upload error:', uploadError);
      return { ok: false, error: `ファイルのアップロードに失敗しました。詳細: ${uploadError?.message || '不明なエラー'}` };
    }

    // 既存のマップの最大orderIndexを取得
    const existingMaps = await db
      .select({ orderIndex: eventMaps.orderIndex })
      .from(eventMaps)
      .where(and(eq(eventMaps.eventId, validated.data.eventId), eq(eventMaps.userId, user.id)));

    const maxOrderIndex = existingMaps.reduce((max, m) => Math.max(max, m.orderIndex), -1);

    await db.insert(eventMaps).values({
      id: mapId,
      eventId: validated.data.eventId,
      userId: user.id,
      name: validated.data.name,
      storagePath: filename,
      mimeType: mimeType,
      orderIndex: maxOrderIndex + 1,
    });

    revalidatePath(`/events/${validated.data.eventId}`);
    return { ok: true };
  } catch (error) {
    console.error('Failed to upload map:', error);
    return { ok: false, error: 'マップの登録に失敗しました。' };
  }
}

export async function deleteEventMap(mapId: string, eventId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    const targetMap = await db.query.eventMaps.findFirst({
      where: and(eq(eventMaps.id, mapId), eq(eventMaps.userId, user.id)),
    });

    if (!targetMap) {
      return { ok: false, error: 'マップが見つかりません。' };
    }

    // Storageから削除
    const { error: deleteStorageError } = await supabase.storage
      .from('oshinagaki')
      .remove([targetMap.storagePath]);

    if (deleteStorageError) {
      console.warn('Failed to delete map from storage:', deleteStorageError);
    }

    // DBから削除
    await db
      .delete(eventMaps)
      .where(and(eq(eventMaps.id, mapId), eq(eventMaps.userId, user.id)));

    revalidatePath(`/events/${eventId}`);
    return { ok: true };
  } catch (error) {
    console.error('Failed to delete map:', error);
    return { ok: false, error: 'マップの削除に失敗しました。' };
  }
}
