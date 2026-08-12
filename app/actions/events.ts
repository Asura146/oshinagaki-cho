'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createEventSchema = z.object({
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
