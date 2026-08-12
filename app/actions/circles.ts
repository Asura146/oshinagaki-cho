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
});

const updateCircleSchema = z.object({
  id: z.string().min(1, 'サークルIDが必要です'),
  eventId: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, 'サークル名は必須です'),
  space: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
  twitterId: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
  memo: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val)),
});

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
    };

    const validated = createCircleSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.errors.map((e) => e.message).join(', '),
      };
    }

    await db.insert(circles).values({
      eventId: validated.data.eventId,
      userId: user.id,
      name: validated.data.name,
      space: validated.data.space,
      twitterId: validated.data.twitterId,
      memo: validated.data.memo,
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
    };

    const validated = updateCircleSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.errors.map((e) => e.message).join(', '),
      };
    }

    await db
      .update(circles)
      .set({
        name: validated.data.name,
        space: validated.data.space,
        twitterId: validated.data.twitterId,
        memo: validated.data.memo,
        updatedAt: new Date(),
      })
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
