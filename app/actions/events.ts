'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

const createEventSchema = z.object({
  name: z.string().min(1, 'イベント名は必須です'),
  eventDate: z.string().optional().transform(val => val === '' ? undefined : val),
  memo: z.string().optional(),
});

const updateEventSchema = z.object({
  id: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, 'イベント名は必須です'),
  eventDate: z.string().optional().transform(val => val === '' ? undefined : val),
  memo: z.string().optional(),
});

export async function createEvent(formData: FormData) {
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
      name: formData.get('name'),
      eventDate: formData.get('eventDate'),
      memo: formData.get('memo'),
    };

    const validated = createEventSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.errors.map((e) => e.message).join(', '),
      };
    }

    await db.insert(events).values({
      userId: user.id,
      name: validated.data.name,
      eventDate: validated.data.eventDate,
      memo: validated.data.memo,
    });

    revalidatePath('/');

    return { ok: true };
  } catch (error) {
    console.error('Failed to create event:', error);
    return { ok: false, error: 'イベントの作成中にエラーが発生しました。' };
  }
}

export async function updateEvent(formData: FormData) {
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
      name: formData.get('name'),
      eventDate: formData.get('eventDate'),
      memo: formData.get('memo'),
    };

    const validated = updateEventSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.errors.map((e) => e.message).join(', '),
      };
    }

    await db
      .update(events)
      .set({
        name: validated.data.name,
        eventDate: validated.data.eventDate,
        memo: validated.data.memo,
        updatedAt: new Date(),
      })
      .where(and(eq(events.id, validated.data.id), eq(events.userId, user.id)));

    revalidatePath('/');

    return { ok: true };
  } catch (error) {
    console.error('Failed to update event:', error);
    return { ok: false, error: 'イベントの更新中にエラーが発生しました。' };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    if (!eventId) {
      return { ok: false, error: 'イベントIDが指定されていません。' };
    }

    await db
      .delete(events)
      .where(and(eq(events.id, eventId), eq(events.userId, user.id)));

    revalidatePath('/');

    return { ok: true };
  } catch (error) {
    console.error('Failed to delete event:', error);
    return { ok: false, error: 'イベントの削除中にエラーが発生しました。' };
  }
}
