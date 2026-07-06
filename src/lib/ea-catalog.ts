import type { GrantProduct } from "@/lib/admin/license-grant";

/**
 * Server-side EA metadata (display name + download paths) keyed by the
 * license_keys.product id. Single source of truth for messages the bot sends
 * so a granted key always names the right EA + links the right files.
 */
export const EA_CATALOG: Record<GrantProduct, { name: string; ex5: string; set: string; guide: string }> = {
  goldwave: {
    name: "GoldWave",
    ex5: "/downloads/goldwave/Dralvo GoldWave.ex5",
    set: "/downloads/goldwave/Dralvo GoldWave - Presets.zip",
    guide: "/downloads/goldwave/Huong_dan_su_dung.html",
  },
  goldmaster: {
    name: "GoldMaster",
    ex5: "/downloads/goldmaster/Dralvo GoldMaster.ex5",
    set: "/downloads/goldmaster/Dralvo GoldMaster - Presets.zip",
    guide: "/downloads/goldmaster/Huong_dan_su_dung.html",
  },
  goldscalp: {
    name: "GoldScalp",
    ex5: "/downloads/goldscalp/Dralvo Gold Scalp.ex5",
    set: "/downloads/goldscalp/Dralvo Gold Scalp - Presets.zip",
    guide: "/downloads/goldscalp/Huong_dan_su_dung.html",
  },
  tigold: {
    name: "TiGold",
    ex5: "/downloads/tigold/Dralvo TiGold.ex5",
    set: "/downloads/tigold/Dralvo tigold v1.set",
    guide: "/downloads/tigold/Huong_dan_su_dung.html",
  },
};
