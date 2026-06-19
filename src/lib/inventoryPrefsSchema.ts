import { z } from 'zod';

export const InventoryPrefsSchema = z.object({
  auto_update_enabled: z.boolean(),
  update_method: z.enum(['manual', 'autoscout']),
  default_listing_status: z.enum(['active', 'draft']),
  auto_mark_sold: z.boolean(),
  on_sold_action: z.enum(['keep_visible', 'hide', 'archive_after_days']),
  archive_after_days: z.number().int().min(1).max(365),
  low_stock_threshold: z.number().int().min(0).max(1000),
  low_stock_push: z.boolean(),
  low_stock_email: z.boolean(),
  auto_relist_on_cancel: z.boolean(),
  relist_delay_minutes: z.number().int().min(0).max(1440),
  reservation_enabled: z.boolean(),
  reservation_minutes: z.number().int().min(5).max(1440),
  allow_negative_stock: z.boolean(),
  allow_backorders: z.boolean(),
  auto_generate_vin_ref: z.boolean(),
  sync_interval_minutes: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(60),
    z.literal(120),
    z.literal(240),
    z.literal(1440),
  ]),
});

export type InventoryPrefs = z.infer<typeof InventoryPrefsSchema>;

export const DEFAULT_INVENTORY_PREFS: InventoryPrefs = {
  auto_update_enabled: true,
  update_method: 'manual',
  default_listing_status: 'active',
  auto_mark_sold: true,
  on_sold_action: 'keep_visible',
  archive_after_days: 30,
  low_stock_threshold: 3,
  low_stock_push: true,
  low_stock_email: true,
  auto_relist_on_cancel: true,
  relist_delay_minutes: 5,
  reservation_enabled: true,
  reservation_minutes: 30,
  allow_negative_stock: false,
  allow_backorders: false,
  auto_generate_vin_ref: false,
  sync_interval_minutes: 60,
};

export const SYNC_INTERVAL_OPTIONS = [15, 30, 60, 120, 240, 1440] as const;
