// EA Vault ("Kho EA"). EAs are admin-managed in vault_eas; only `enabled`
// ones show here. Each EA is independently gated: requires_license=false EAs
// are downloadable by any signed-in user, requires_license=true EAs need an
// active VIP (unlimited) license. Each card uses a generated cover
// (/ea-art/<slug>.svg) as background. Downloads (EA / set file / install
// guide) go through the gated /api/vault/download route.
import type { Metadata } from "next";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getServerLocale } from "@/lib/server-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import Link from "next/link";
import { Download, Settings2, BookOpen, Lock, type LucideIcon } from "lucide-react";

export const metadata: Metadata = { title: "Dralvo | Kho EA" };

interface VaultEa {
  id: string;
  name: string;
  version: string | null;
  description: string | null;
  set_storage_path: string | null;
  guide_storage_path: string | null;
  requires_license: boolean;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default async function KhoEAPage() {
  const locale = await getServerLocale();
  const c = DASHBOARD_COPY[locale].khoPage;
  let isLoggedIn = false;
  let hasAccess = false;
  let eas: VaultEa[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = getSupabaseAdminClient();
    isLoggedIn = !!user;
    if (user && admin) {
      const { data, error } = await admin
        .from("license_keys")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("plan", "unlimited")
        .order("expires_at", { ascending: false, nullsFirst: true })
        .limit(1);
      if (!error && data && data.length > 0) {
        const lic = data[0];
        hasAccess = !lic.expires_at || new Date(lic.expires_at) > new Date();
      }

      const { data: rows } = await admin
        .from("vault_eas")
        .select("id, name, version, description, set_storage_path, guide_storage_path, requires_license")
        .eq("enabled", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      eas = (rows as VaultEa[]) ?? [];
    }
  } catch {}

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-border bg-surface/60 p-8 text-center">
        <h2 className="text-xl font-semibold text-text-primary">{c.title}</h2>
        <p className="mt-2 text-sm text-text-muted max-w-md mx-auto">{c.signInRequired}</p>
        <Link href="/login" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-gold-action text-[#060609] no-underline">
          {c.signInCta}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary mb-4">{c.title}</h2>
      {eas.length === 0 ? (
        <p className="text-sm text-text-muted">{c.emptyState}</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {eas.map((ea) => {
            const locked = ea.requires_license && !hasAccess;
            return (
              <article
                key={ea.id}
                className="relative overflow-hidden rounded-xl border border-border min-h-[180px] flex flex-col justify-between"
              >
                {/* Generated cover background */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(/ea-art/${slugify(ea.name)}.svg)` }}
                />
                {/* Readability overlay */}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#070a0e] via-[#070a0e]/80 to-[#070a0e]/30" />
                {locked && <div aria-hidden className="absolute inset-0 backdrop-grayscale backdrop-brightness-[0.6]" />}

                {/* Content */}
                <div className="relative p-5 flex flex-col h-full justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white tracking-tight truncate">{ea.name}</h3>
                      {ea.version && <span className="text-[11px] text-white/55 font-mono">v{ea.version}</span>}
                      <p className={`text-[12px] mt-1 line-clamp-2 ${ea.description ? "text-white/75" : "text-white/45 italic"}`}>
                        {ea.description ?? c.descriptionPlaceholder}
                      </p>
                    </div>
                    <span
                      className={`px-2 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        ea.requires_license ? "bg-gold/15 border-gold/40" : "bg-green/15 border-green/40"
                      }`}
                    >
                      <span className={`text-[10px] font-mono font-bold tracking-wider ${ea.requires_license ? "text-gold" : "text-green"}`}>
                        {ea.requires_license ? c.vipRequiredBadge : c.freeBadge}
                      </span>
                    </span>
                  </div>

                  {locked ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
                        <Lock size={12} /> {c.vipLockedHint}
                      </span>
                      <Link
                        href="/pricing"
                        className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gold-action text-[#060609] no-underline hover:scale-[1.03] transition-transform"
                      >
                        {c.upgradeCta}
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <a
                        href={`/api/vault/download?id=${ea.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-gold text-[#060609] no-underline hover:scale-[1.03] transition-transform"
                      >
                        <Download size={12} /> .ex5
                      </a>
                      <DownloadBtn href={`/api/vault/download?id=${ea.id}&type=set`} enabled={!!ea.set_storage_path} label="Set file" soonLabel={c.comingSoon} Icon={Settings2} />
                      <DownloadBtn href={`/api/vault/download?id=${ea.id}&type=guide`} enabled={!!ea.guide_storage_path} label={c.guide} soonLabel={c.comingSoon} Icon={BookOpen} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DownloadBtn({ href, enabled, label, soonLabel, Icon }: { href: string; enabled: boolean; label: string; soonLabel: string; Icon: LucideIcon }) {
  if (!enabled) {
    return (
      <span
        title={soonLabel}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
      >
        <Icon size={12} /> {label}
      </span>
    );
  }
  const isGuide = Icon === BookOpen;
  return (
    <a
      href={href}
      target={isGuide ? "_blank" : undefined}
      rel={isGuide ? "noreferrer" : undefined}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-white/10 border border-white/15 text-white no-underline hover:bg-white/15 transition-colors"
    >
      <Icon size={12} /> {label}
    </a>
  );
}
