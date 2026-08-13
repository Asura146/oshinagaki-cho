'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { oshinagakiImages } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

export async function uploadOshinagakiImage(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    const circleId = formData.get('circleId') as string;
    const eventId = formData.get('eventId') as string;
    const file = formData.get('imageFile') as File | null;

    if (!circleId || !eventId) {
      return { ok: false, error: 'サークルIDおよびイベントIDが必要です。' };
    }

    if (!file || file.size === 0) {
      return { ok: false, error: '画像ファイルを選択してください。' };
    }

    // 5MB制限
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, error: '画像ファイルは5MB以下にしてください。' };
    }

    const fileBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(fileBuffer).toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    let finalPath = dataUrl;
    const filename = `${user.id}/${circleId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('oshinagaki')
        .upload(filename, fileBuffer, { contentType: mimeType, upsert: true });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('oshinagaki')
          .getPublicUrl(filename);
        if (publicUrlData?.publicUrl) {
          finalPath = publicUrlData.publicUrl;
        }
      }
    } catch {
      // Storageが使えない場合でも Base64 Data URI で確実に保存
    }

    await db.insert(oshinagakiImages).values({
      circleId,
      userId: user.id,
      storagePath: finalPath,
    });

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('Failed to upload oshinagaki image:', error);
    return { ok: false, error: 'お品書き画像のアップロードに失敗しました。' };
  }
}

export async function deleteOshinagakiImage(imageId: string, eventId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    if (!imageId) {
      return { ok: false, error: '画像IDが指定されていません。' };
    }

    await db
      .delete(oshinagakiImages)
      .where(and(eq(oshinagakiImages.id, imageId), eq(oshinagakiImages.userId, user.id)));

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('Failed to delete oshinagaki image:', error);
    return { ok: false, error: '画像の削除に失敗しました。' };
  }
}
