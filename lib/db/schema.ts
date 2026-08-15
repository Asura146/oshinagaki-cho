import { pgTable, uuid, text, integer, boolean, timestamp, date, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  eventDate: date('event_date'),
  memo: text('memo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ userIdx: index('events_user_id_idx').on(t.userId) }));

export const circles = pgTable('circles', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  twitterId: text('twitter_id'),
  space: text('space'),
  avatarPath: text('avatar_path'),
  memo: text('memo'),
  priority: text('priority').default('medium').notNull(),
  isExcluded: boolean('is_excluded').default(false).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('circles_event_id_idx').on(t.eventId),
  userIdx: index('circles_user_id_idx').on(t.userId),
}));

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  circleId: uuid('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  price: integer('price').default(0).notNull(),
  qty: integer('qty').default(1).notNull(),
  checked: boolean('checked').default(false).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  circleIdx: index('items_circle_id_idx').on(t.circleId),
  qtyCheck: check('items_qty_check', sql`${t.qty} >= 1`),
}));

export const oshinagakiImages = pgTable('oshinagaki_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  circleId: uuid('circle_id').notNull().references(() => circles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  storagePath: text('storage_path').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ circleIdx: index('oshinagaki_circle_id_idx').on(t.circleId) }));

export const unplannedPurchases = pgTable('unplanned_purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  price: integer('price').default(0).notNull(),
  qty: integer('qty').default(1).notNull(),
  circleName: text('circle_name'),
  memo: text('memo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  eventIdx: index('unplanned_purchases_event_id_idx').on(t.eventId),
  userIdx: index('unplanned_purchases_user_id_idx').on(t.userId),
  qtyCheck: check('unplanned_purchases_qty_check', sql`${t.qty} >= 1`),
}));

// リレーション定義
export const eventsRelations = relations(events, ({ many }) => ({
  circles: many(circles),
  unplannedPurchases: many(unplannedPurchases),
}));
export const circlesRelations = relations(circles, ({ one, many }) => ({
  event: one(events, { fields: [circles.eventId], references: [events.id] }),
  items: many(items),
  oshinagakiImages: many(oshinagakiImages),
}));
export const itemsRelations = relations(items, ({ one }) => ({ circle: one(circles, { fields: [items.circleId], references: [circles.id] }) }));
export const oshinagakiImagesRelations = relations(oshinagakiImages, ({ one }) => ({ circle: one(circles, { fields: [oshinagakiImages.circleId], references: [circles.id] }) }));
export const unplannedPurchasesRelations = relations(unplannedPurchases, ({ one }) => ({
  event: one(events, { fields: [unplannedPurchases.eventId], references: [events.id] }),
}));
