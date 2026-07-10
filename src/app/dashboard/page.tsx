// ponytail: customer portal — license key + EA downloads
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { CftcStatusCard } from "@/components/dashboard/cftc-status-card";
import { EaCard } from "@/components/dashboard/ea-card";
import { MarketHeader } from "@/components/dashboard/market-header";
import { getServerLocale } from "@/lib/server-locale";
import { DASHBOARD_COPY, FALLBACK_LOCALE, type SupportedLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Dralvo | License & Downloads",
};

// Each entry's `product` matches the license_keys.product id sent by the EA.
const EA_DOWNLOADS = {
  goldmaster: {
    name: "GoldMaster",
    tf: "D1 Swing",
    accent: "#d4a82d",
    ex5: "/downloads/goldmaster/Dralvo GoldMaster.ex5",
    set: "/downloads/goldmaster/Dralvo GoldMaster - Presets.zip",
  },
  goldscalp: {
    name: "GoldScalp",
    tf: "M15 Momentum",
    accent: "#5aa9e6",
    ex5: "/downloads/goldscalp/Dralvo Gold Scalp.ex5",
    set: "/downloads/goldscalp/Dralvo Gold Scalp - Presets.zip",
  },
  tigold: {
    name: "TiGold",
    tf: "M1 Adaptive",
    accent: "#00c98d",
    ex5: "/downloads/tigold/Dralvo TiGold.ex5",
    set: "/downloads/tigold/Dralvo TiGold - Presets.zip",
  },
  goldwave: {
    name: "GoldWave",
    tf: "Sideway · 2 preset (Safe / HighProfit)",
    accent: "#2b7fbf",
    ex5: "/downloads/goldwave/Dralvo GoldWave.ex5",
    set: "/downloads/goldwave/Dralvo GoldWave - Presets.zip",
  },
} as const;

type EaKey = keyof typeof EA_DOWNLOADS;

/**
 * Which locales have a translated usage guide, per EA. "vi" is the base file
 * Huong_dan_su_dung.html; other locales are Huong_dan_su_dung.<locale>.html.
 * The user's locale is served when available, else English (fallback), else vi.
 */
const GUIDE_LOCALES: Partial<Record<EaKey, SupportedLocale[]>> = {
  goldmaster: ["vi", "en", "pt-BR", "es", "id", "ar"],
  goldscalp: ["vi", "en", "pt-BR", "es", "id", "ar"],
  tigold: ["vi", "en", "pt-BR", "es", "id", "ar"],
  goldwave: ["vi", "en", "pt-BR", "es", "id", "ar"],
};

function resolveGuide(id: EaKey, locale: SupportedLocale): string | undefined {
  const avail = GUIDE_LOCALES[id];
  if (!avail || avail.length === 0) return undefined;
  const chosen = avail.includes(locale)
    ? locale
    : avail.includes(FALLBACK_LOCALE)
      ? FALLBACK_LOCALE
      : avail[0];
  const file = chosen === "vi" ? "Huong_dan_su_dung.html" : `Huong_dan_su_dung.${chosen}.html`;
  return `/downloads/${id}/${file}`;
}

interface KeyInfo {
  key: string;
  plan: string;
  expires_at: string | null;
}

const TELEGRAM_ADMIN = "https://t.me/dralvoea";

/** A per-EA license row is usable if it has no expiry, or expires in the future. */
function isLicenseActive(row: { expires_at: string | null }): boolean {
  return !row.expires_at || new Date(row.expires_at) > new Date();
}

export default async function DashboardPage() {
  const locale = await getServerLocale();
  const c = DASHBOARD_COPY[locale].dashboardHome;

  // product → its active license row (key + expiry + tier)
  const keysByProduct: Partial<Record<EaKey, KeyInfo>> = {};
  // products where the user held a key but the 3-day trial has expired
  const expiredProducts = new Set<EaKey>();

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = getSupabaseAdminClient();
    if (user && admin) {
      // license_keys is not readable by the `authenticated` role under RLS,
      // so read through the admin client scoped to this user id. A user may
      // now hold one key per EA.
      const { data } = await admin
        .from("license_keys")
        .select("key, plan, product, expires_at")
        .eq("user_id", user.id);
      for (const row of data ?? []) {
        const product = row.product as EaKey | null;
        if (!product || !(product in EA_DOWNLOADS)) continue;
        if (isLicenseActive(row)) {
          keysByProduct[product] = { key: row.key, plan: row.plan, expires_at: row.expires_at };
        } else {
          // Row exists but expired → show the "trial ended, renew" state.
          expiredProducts.add(product);
        }
      }
    }
  } catch { /* table may not exist — show free UI */ }

  // Every EA is now a free 3-day trial, so show all of them to everyone.
  // GoldWave is pinned first (featured EA).
  const eaList = (Object.keys(EA_DOWNLOADS) as EaKey[])
    .sort((a, b) => (a === "goldwave" ? -1 : b === "goldwave" ? 1 : 0));

  return (
    <div className="space-y-6">
      {/* Market data (Twelve Data) + CFTC positioning — one row, two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <MarketHeader />
        <CftcStatusCard />
      </div>

      {/* Dralvo EA cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {eaList.map((id) => {
          const ea = EA_DOWNLOADS[id];
          const lic = keysByProduct[id];
          return (
            <EaCard
              key={id}
              id={id}
              name={ea.name}
              tf={ea.tf}
              accent={ea.accent}
              ex5={ea.ex5}
              set={ea.set}
              guide={resolveGuide(id, locale)}
              license={lic ? { key: lic.key, expiresAt: lic.expires_at } : null}
              trialExpired={!lic && expiredProducts.has(id)}
            />
          );
        })}
      </div>

      {/* Contact admin for more keys / accounts */}
      <div className="card-elevate rounded-xl border border-border bg-card/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-text-muted">
          {c.contactPrompt}
        </p>
        <a href={TELEGRAM_ADMIN} target="_blank" className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15 no-underline transition-colors">
          {c.contactAdmin}
        </a>
      </div>
    </div>
  );
}
