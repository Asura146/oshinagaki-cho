'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { unplannedPurchases } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

const createUnplannedPurchaseSchema = z.object({
  eventId: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, '品名は必須です'),
  price: z.coerce.number().min(0, '金額は0以上を入力してください').default(0),
  qty: z.coerce.number().min(1, '数量は1以上を入力してください').default(1),
  circleName: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val.trim())),
  memo: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val.trim())),
});

const updateUnplannedPurchaseSchema = z.object({
  id: z.string().min(1, 'IDが必要です'),
  eventId: z.string().min(1, 'イベントIDが必要です'),
  name: z.string().min(1, '品名は必須です'),
  price: z.coerce.number().min(0, '金額は0以上を入力してください').default(0),
  qty: z.coerce.number().min(1, '数量は1以上を入力してください').default(1),
  circleName: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val.trim())),
  memo: z.string().optional().nullable().transform((val) => (!val || val.trim() === '' ? null : val.trim())),
});

export async function createUnplannedPurchase(formData: FormData) {
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
      price: formData.get('price') || 0,
      qty: formData.get('qty') || 1,
      circleName: formData.get('circleName'),
      memo: formData.get('memo'),
    };

    const validated = createUnplannedPurchaseSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues.map((e) => e.message).join(', '),
      };
    }

    const [inserted] = await db
      .insert(unplannedPurchases)
      .values({
        eventId: validated.data.eventId,
        userId: user.id,
        name: validated.data.name,
        price: validated.data.price,
        qty: validated.data.qty,
        circleName: validated.data.circleName,
        memo: validated.data.memo,
      })
      .returning();

    revalidatePath(`/events/${validated.data.eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true, data: inserted };
  } catch (error) {
    console.error('Failed to create unplanned purchase:', error);
    return { ok: false, error: '予定外購入の追加に失敗しました。' };
  }
}

export async function updateUnplannedPurchase(formData: FormData) {
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
      circleName: formData.get('circleName'),
      memo: formData.get('memo'),
    };

    const validated = updateUnplannedPurchaseSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues.map((e) => e.message).join(', '),
      };
    }

    const [updated] = await db
      .update(unplannedPurchases)
      .set({
        name: validated.data.name,
        price: validated.data.price,
        qty: validated.data.qty,
        circleName: validated.data.circleName,
        memo: validated.data.memo,
        updatedAt: new Date(),
      })
      .where(and(eq(unplannedPurchases.id, validated.data.id), eq(unplannedPurchases.userId, user.id)))
      .returning();

    revalidatePath(`/events/${validated.data.eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true, data: updated };
  } catch (error) {
    console.error('Failed to update unplanned purchase:', error);
    return { ok: false, error: '予定外購入の更新に失敗しました。' };
  }
}

export async function deleteUnplannedPurchase(id: string, eventId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: '認証が必要です。ログインし直してください。' };
    }

    if (!id) {
      return { ok: false, error: 'IDが指定されていません。' };
    }

    await db
      .delete(unplannedPurchases)
      .where(and(eq(unplannedPurchases.id, id), eq(unplannedPurchases.userId, user.id)));

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('Failed to delete unplanned purchase:', error);
    return { ok: false, error: '予定外購入の削除に失敗しました。' };
  }
}
