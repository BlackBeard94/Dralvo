// ponytail: customer portal — license key + EA downloads
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dralvo | License & Downloads",
};

const EA_DOWNLOADS = {
  goldmaster: {
    name: "GoldMaster",
    tf: "D1 Swing",
    accent: "#d4a82d",
    ex5: "/downloads/goldmaster/Dralvo GoldMaster.ex5",
    set: "/downloads/goldmaster/Dralvo GoldMaster v1.08.set",
  },
  scalp: {
    name: "GoldScalp",
    tf: "M5 Momentum",
    accent: "#5aa9e6",
    ex5: "/downloads/goldscalp/Dralvo Gold Scalp.ex5",
    set: "/downloads/goldscalp/Dralvo Gold Scalp v2.set",
  },
  tigold: {
    name: "TiGold",
    tf: "M1 Adaptive",
    accent: "#00c98d",
    ex5: "/downloads/tigold/Dralvo TiGold.ex5",
    set: "/downloads/tigold/Dralvo tigold v1.set",
    guide: "/downloads/tigold/Huong_dan_su_dung.html",
  },
} as const;

type EaKey = keyof typeof EA_DOWNLOADS;

export default async function DashboardPage() {
  let licenseKey: string | null = null;
  let plan: string | null = null;
  let expiresAt: string | null = null;
  let hasAccess = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = getSupabaseAdminClient();
    if (user && admin) {
      // license_keys is not readable by the `authenticated` role under RLS,
      // so read through the admin client scoped to this user id.
      const { data } = await admin
        .from("license_keys")
        .select("key, plan, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      // ponytail: valid = unlimited AND not expired
      const currentPeriodEnd = data?.expires_at;
      const valid =
        !!data &&
        data.plan === "unlimited" &&
        (!currentPeriodEnd || new Date(currentPeriodEnd) > new Date());
      if (valid) {
        licenseKey = data.key;
        plan = data.plan;
        expiresAt = data.expires_at;
        hasAccess = true;
      }
    }
  } catch { /* table may not exist — show free UI */ }

  const eaList: EaKey[] = hasAccess ? ["goldmaster", "scalp", "tigold"] : ["tigold"];

  return (
    <div className="space-y-6">
      {/* License status bar */}
      <div className="rounded-xl border p-5"
        style={{ borderColor: hasAccess ? "rgba(212,168,67,0.35)" : "rgba(0,201,141,0.3)", background: hasAccess ? "linear-gradient(135deg, rgba(212,168,67,0.08), var(--bg-card) 70%)" : "linear-gradient(135deg, rgba(0,201,141,0.08), var(--bg-card) 70%)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: hasAccess ? "var(--gold-bright)" : "#00c98d" }}>
              {hasAccess ? "Dralvo Unlimited" : "Dralvo Free"}
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {hasAccess
                ? `License key: ${licenseKey} · Hết hạn: ${expiresAt ? new Date(expiresAt).toLocaleDateString("vi-VN") : "Vĩnh viễn"}`
                : "Miễn phí trọn đời — mở tài khoản qua đối tác IB Dralvo"}
            </p>
          </div>
          {!hasAccess && (
            <Link href="/pricing" className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold bg-gold-bright text-[#060609] no-underline hover:scale-[1.02] transition-transform">
              Nâng cấp lên Unlimited
            </Link>
          )}
        </div>
      </div>

      {/* Dralvo EA */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {eaList.map((id) => {
          const ea = EA_DOWNLOADS[id];
          return (
            <div key={id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-text-primary">{ea.name}</h3>
                  <p className="text-xs text-text-muted">{ea.tf}</p>
                </div>
                <span className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${ea.accent}1a`, border: `1px solid ${ea.accent}40` }}>
                  <span className="text-xs font-mono font-bold" style={{ color: ea.accent }}>{ea.tf.split(" ")[0]}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={ea.ex5} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15 no-underline transition-colors">
                  Tải .ex5
                </a>
                {"set" in ea && (
                  <a href={ea.set} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-card border border-border text-text-secondary hover:text-text-primary no-underline transition-colors">
                    Tải .set
                  </a>
                )}
                {"guide" in ea && (
                  <a href={ea.guide} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-card border border-border text-text-muted hover:text-text-primary no-underline transition-colors">
                    Hướng dẫn
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
