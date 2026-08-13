'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { circles } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

const createCircleSchema = z.object({
  eventId: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, 'サークル名は必須です'),
  space: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
  twitterId: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
  memo: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
});

const updateCircleSchema = z.object({
  id: z.string().min(1, 'サークルIDが必要です'),
  eventId: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, 'サークル名は必須です'),
  space: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
  twitterId: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
  memo: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
});

async function processAvatarFile(file: File | null, userId: string, circleId: string, supabase: any): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const fileBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(fileBuffer).toString('base64');
  const mimeType = file.type || 'image/png';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  let finalPath = dataUrl;
  const filename = `${userId}/avatars/${circleId}_${Date.now()}`;
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
    // Storage利用不可時のフォールバック
  }
  return finalPath;
}

export async function createCircle(formData: FormData) {
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
      space: formData.get('space'),
      twitterId: formData.get('twitterId'),
      memo: formData.get('memo'),
      priority: formData.get('priority') || 'medium',
    };

    const validated = createCircleSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues.map((e) => e.message).join(', '),
      };
    }

    const avatarFile = formData.get('avatarFile') as File | null;
    const tempCircleId = crypto.randomUUID();
    const avatarPath = await processAvatarFile(avatarFile, user.id, tempCircleId, supabase);

    const existingCircles = await db
      .select({ orderIndex: circles.orderIndex })
      .from(circles)
      .where(and(eq(circles.eventId, validated.data.eventId), eq(circles.userId, user.id)));

    const maxOrderIndex = existingCircles.reduce((max, c) => Math.max(max, c.orderIndex), -1);

    await db.insert(circles).values({
      id: tempCircleId,
      eventId: validated.data.eventId,
      userId: user.id,
      name: validated.data.name,
      space: validated.data.space,
      twitterId: validated.data.twitterId,
      memo: validated.data.memo,
      avatarPath: avatarPath,
      priority: validated.data.priority,
      orderIndex: maxOrderIndex + 1,
    });

    revalidatePath(`/events/${validated.data.eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('Failed to create circle:', error);
    return { ok: false, error: 'サークルの追加に失敗しました。' };
  }
}

export async function updateCircle(formData: FormData) {
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
      id: formData.get('id'),
      eventId: formData.get('eventId'),
      name: formData.get('name'),
      space: formData.get('space'),
      twitterId: formData.get('twitterId'),
      memo: formData.get('memo'),
      priority: formData.get('priority') || 'medium',
    };

    const validated = updateCircleSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues.map((e) => e.message).join(', '),
      };
    }

    const avatarFile = formData.get('avatarFile') as File | null;
    const newAvatarPath = await processAvatarFile(avatarFile, user.id, validated.data.id, supabase);

    const updateValues: Record<string, any> = {
      name: validated.data.name,
      space: validated.data.space,
      twitterId: validated.data.twitterId,
      memo: validated.data.memo,
      priority: validated.data.priority,
      updatedAt: new Date(),
    };

    if (newAvatarPath) {
      updateValues.avatarPath = newAvatarPath;
    }

    await db
      .update(circles)
      .set(updateValues)
      .where(and(eq(circles.id, validated.data.id), eq(circles.userId, user.id)));

    revalidatePath(`/events/${validated.data.eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('Failed to update circle:', error);
    return { ok: false, error: 'サークルの更新に失敗しました。' };
  }
}

export async function deleteCircle(circleId: string, eventId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    if (!circleId) {
      return { ok: false, error: 'サークルIDが指定されていません。' };
    }

    await db
      .delete(circles)
      .where(and(eq(circles.id, circleId), eq(circles.userId, user.id)));

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('Failed to delete circle:', error);
    return { ok: false, error: 'サークルの削除に失敗しました。' };
  }
}

export async function reorderCircles(eventId: string, orderedCircleIds: string[]) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    await Promise.all(
      orderedCircleIds.map((id, index) =>
        db
          .update(circles)
          .set({ orderIndex: index, updatedAt: new Date() })
          .where(and(eq(circles.id, id), eq(circles.userId, user.id)))
      )
    );

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('Failed to reorder circles:', error);
    return { ok: false, error: '順序の変更に失敗しました。' };
  }
}
