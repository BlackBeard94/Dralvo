// ponytail: EA Vault — unlocked with Unlimited plan
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";

export const metadata: Metadata = { title: "Dralvo | Kho EA" };

const VAULT_EAS = [
  { name: "BB Return", file: "BB Return MT5.ex5" },
  { name: "Osmosis", file: "Osmosis 1.3_ MT5.ex5" },
  { name: "Perceptrader AI", file: "Perceptrader AI MT5 v2.43.ex5" },
  { name: "Quantum Athena", file: "Quantum Athena_1.1_MT5.ex5" },
  { name: "Quantum Gold Emperor", file: "Quantum Gold Emperor MT5 v1.2.ex5" },
  { name: "Quantum King EA", file: "Quantum King EA_3.1_MT5.ex5" },
  { name: "Quantum Queen", file: "Quantum Queen v2.1_MT5.ex5" },
  { name: "Scalping Robot Pro", file: "Scalping Robot Pro MT5_2.0.ex5" },
  { name: "Sharkyra Gold", file: "Sharkyra Gold v1.1_MT5.ex5" },
  { name: "The Gold Reaper", file: "The Gold Reaper MT5 v4.3.ex5" },
  { name: "TwisterPro Scalper", file: "TwisterPro Scalper v1.8_MT5.ex5" },
  { name: "Wave Rider EA", file: "Wave Rider EA MT5_4.1.ex5" },
] as const;

const PURPLE = "#a855f7";

export default async function KhoEAPage() {
  let hasAccess = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("license_keys")
        .select("expires_at")
        .eq("user_id", user.id)
        .limit(1);
      if (!error && data && data.length > 0) {
        const lic = data[0];
        hasAccess = !lic.expires_at || new Date(lic.expires_at) > new Date();
      }
    }
  } catch {}

  if (!hasAccess) {
    return (
      <div className="rounded-2xl border border-border bg-surface/60 p-8 text-center">
        <h2 className="text-xl font-semibold text-text-primary">Kho EA</h2>
        <p className="mt-2 text-sm text-text-muted max-w-md mx-auto">
          Kho EA 12+ robot nổi tiếng chỉ dành cho gói Dralvo Unlimited.
        </p>
        <Link href="/pricing" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-gold-action text-[#060609] no-underline">
          Nâng cấp lên Unlimited
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">Kho EA</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {VAULT_EAS.map((ea) => (
          <div key={ea.file} className="rounded-xl border p-6" style={{ borderColor: "rgba(168,85,247,0.2)", background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-text-primary">{ea.name}</h3>
              </div>
              <span className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}>
                <span className="text-xs font-mono font-bold" style={{ color: PURPLE }}>EA</span>
              </span>
            </div>
            <a href={`/downloads/kho/${ea.file}`} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15 no-underline transition-colors">
              Tải .ex5
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
