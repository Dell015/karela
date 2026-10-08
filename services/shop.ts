import { refreshBuffs } from "@/services/buffs";
import { callRpc } from "@/services/rpc";

/**
 * The Shop (supabase/10_streak_protection_and_shop.sql). Prices and items
 * come from the server; every purchase is checked and paid there.
 */

export type ShopCategory = "streak" | "boost" | "cosmetic";
export type ShopKind = "freeze" | "repair" | "boost" | "guild_boost" | "cosmetic";
export type CosmeticSlot = "trail" | "frame";

export interface ShopItem {
  id: string;
  category: ShopCategory;
  kind: ShopKind;
  slot: CosmeticSlot | null;
  name: string;
  description: string;
  price: number;
  rarity: "common" | "rare";
  value: { colors?: string[]; hours?: number; max_held?: number; [k: string]: unknown };
  sort: number;
}

export interface ShopState {
  items: ShopItem[];
  owned: string[];
  equipped: Partial<Record<CosmeticSlot, string>>;
  /** item id -> ISO time it ends */
  boosts: Record<string, string>;
  repair_available: boolean;
  repair_streak: number;
}

export const getShopState = () => callRpc<ShopState>("get_shop_state");

/** Buys an item; returns the new Gem balance. */
export const buyItem = async (itemId: string) => {
  const res = await callRpc<{ gems: number }>("buy_item", { p_item_id: itemId });
  refreshBuffs();
  return res.gems;
};

/** Wears an owned cosmetic, or `null` for the default look. */
export const equipItem = async (slot: CosmeticSlot, itemId: string | null) => {
  await callRpc<void>("equip_item", { p_slot: slot, p_item_id: itemId });
  refreshBuffs();
};

export const SLOT_LABEL: Record<CosmeticSlot, string> = {
  trail: "Run trail",
  frame: "Photo frame",
};

/** "23 h left" / "45 min left" for a boost end time. */
export const timeLeft = (iso: string, now = Date.now()) => {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "ended";
  const h = Math.floor(ms / 3_600_000);
  return h >= 1 ? `${h} h left` : `${Math.max(1, Math.round(ms / 60_000))} min left`;
};
