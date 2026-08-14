'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

const createItemSchema = z.object({
  circleId: z.string().min(1, 'サークルIDが必要です'),
  eventId: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, '品名は必須です'),
  price: z.coerce.number().min(0, '金額は0以上を入力してください').default(0),
  qty: z.coerce.number().min(1, '数量は1以上を入力してください').default(1),
});

const updateItemSchema = z.object({
  id: z.string().min(1, 'アイテムIDが必要です'),
  eventId: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, '品名は必須です'),
  price: z.coerce.number().min(0, '金額は0以上を入力してください').default(0),
  qty: z.coerce.number().min(1, '数量は1以上を入力してください').default(1),
});

export async function createItem(formData: FormData) {
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
      circleId: formData.get('circleId'),
      eventId: formData.get('eventId'),
      name: formData.get('name'),
      price: formData.get('price') || 0,
      qty: formData.get('qty') || 1,
    };

    const validated = createItemSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues.map((e) => e.message).join(', '),
      };
    }

    await db.insert(items).values({
      circleId: validated.data.circleId,
      userId: user.id,
      name: validated.data.name,
      price: validated.data.price,
      qty: validated.data.qty,
      checked: false,
    });

    revalidatePath(`/events/${validated.data.eventId}`);

    return { ok: true };
  } catch (error) {
    console.error('Failed to create item:', error);
    return { ok: false, error: 'アイテムの追加に失敗しました。' };
  }
}

export async function updateItem(formData: FormData) {
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
      price: formData.get('price') || 0,
      qty: formData.get('qty') || 1,
    };

    const validated = updateItemSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues.map((e) => e.message).join(', '),
      };
    }

    await db
      .update(items)
      .set({
        name: validated.data.name,
        price: validated.data.price,
        qty: validated.data.qty,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, validated.data.id), eq(items.userId, user.id)));

    revalidatePath(`/events/${validated.data.eventId}`);

    return { ok: true };
  } catch (error) {
    console.error('Failed to update item:', error);
    return { ok: false, error: 'アイテムの更新に失敗しました。' };
  }
}

export async function toggleItemChecked(itemId: string, eventId: string, currentChecked: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    await db
      .update(items)
      .set({
        checked: !currentChecked,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, itemId), eq(items.userId, user.id)));

    revalidatePath(`/events/${eventId}`);

    return { ok: true };
  } catch (error) {
    console.error('Failed to toggle item checked:', error);
    return { ok: false, error: '状態の更新に失敗しました。' };
  }
}

export async function toggleAllItemsInCircle(circleId: string, eventId: string, targetChecked: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    await db
      .update(items)
      .set({
        checked: targetChecked,
        updatedAt: new Date(),
      })
      .where(and(eq(items.circleId, circleId), eq(items.userId, user.id)));

    revalidatePath(`/events/${eventId}`);

    return { ok: true };
  } catch (error) {
    console.error('Failed to toggle all items in circle:', error);
    return { ok: false, error: '一括状態更新に失敗しました。' };
  }
}

export async function deleteItem(itemId: string, eventId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    if (!itemId) {
      return { ok: false, error: 'アイテムIDが指定されていません。' };
    }

    await db
      .delete(items)
      .where(and(eq(items.id, itemId), eq(items.userId, user.id)));

    revalidatePath(`/events/${eventId}`);

    return { ok: true };
  } catch (error) {
    console.error('Failed to delete item:', error);
    return { ok: false, error: 'アイテムの削除に失敗しました。' };
  }
}
