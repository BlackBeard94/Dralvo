/**
 * GET /api/marketing/pixels — public. Resolves the pixel ids to fire for THIS
 * request: Dralvo's own (DB overrides env) plus, when a `dralvo_partner` cookie
 * is present, that partner's ids. Returns ready-to-render id arrays so the
 * client pixel loader stays dumb and the root layout can remain static.
 *
 * All ids were validated before storage, so they're safe to inline client-side.
 */
import { NextResponse } from "next/server";

import {
  getActivePartnerPixels,
  getDralvoTrackingSettings,
  type PixelIds,
} from "@/lib/marketing/tracking-settings";

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export async function GET() {
  const dralvo = await getDralvoTrackingSettings();
  const partner = await getActivePartnerPixels();

  const pick = (fn: (p: PixelIds) => string) => uniq([fn(dralvo), partner ? fn(partner) : ""]);

  const payload = {
    gtagIds: uniq([...pick((p) => p.ga4Id), ...pick((p) => p.googleAdsId)]),
    metaIds: pick((p) => p.metaPixelId),
    tiktokIds: pick((p) => p.tiktokPixelId),
    customHead: dralvo.customHead || "",
    customBody: dralvo.customBody || "",
  };

  // Short cache: pixel config rarely changes; partner cookie varies the result
  // so mark private.
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
