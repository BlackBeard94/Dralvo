"use client";

import { useCallback, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronsDown,
  Copy,
  Loader2,
  MonitorSmartphone,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { EaLogo, type EaId } from "./ea-logo";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Device = {
  mt5_account: string;
  first_seen: string;
  last_seen: string;
  active: boolean;
};

type DevicesState = {
  maxAccounts: number;
  preBound: string | null;
  devices: Device[];
};

// Inline copy for the TiGold "activate via bot" CTA (kept out of the big i18n
// file since it's a single self-contained widget).
const ACTIVATE_COPY: Record<string, { hint: string; btn: string; opening: string; err: string }> = {
  vi: { hint: "Bấm để chat với bot Dralvo & nhận license miễn phí. Key sẽ hiện tại đây sau khi admin duyệt.", btn: "Kích hoạt qua Telegram", opening: "Đang mở…", err: "Không tạo được link, thử lại." },
  en: { hint: "Tap to chat with the Dralvo bot & get your free license. The key appears here once approved.", btn: "Activate via Telegram", opening: "Opening…", err: "Couldn't create the link, try again." },
  "pt-BR": { hint: "Toque para falar com o bot da Dralvo e receber sua licença grátis. A chave aparece aqui após a aprovação.", btn: "Ativar via Telegram", opening: "Abrindo…", err: "Não foi possível criar o link, tente de novo." },
  es: { hint: "Toca para chatear con el bot de Dralvo y obtener tu licencia gratis. La clave aparece aquí tras la aprobación.", btn: "Activar por Telegram", opening: "Abriendo…", err: "No se pudo crear el enlace, inténtalo de nuevo." },
  id: { hint: "Ketuk untuk chat dengan bot Dralvo & dapatkan lisensi gratis. Kunci muncul di sini setelah disetujui.", btn: "Aktifkan via Telegram", opening: "Membuka…", err: "Gagal membuat tautan, coba lagi." },
  ar: { hint: "اضغط للدردشة مع بوت Dralvo والحصول على ترخيصك المجاني. يظهر المفتاح هنا بعد الموافقة.", btn: "تفعيل عبر تيليجرام", opening: "جارٍ الفتح…", err: "تعذّر إنشاء الرابط، حاول مجدداً." },
};

export interface EaCardProps {
  id: EaId;
  name: string;
  tf: string;
  accent: string;
  ex5: string;
  set?: string;
  guide?: string;
  license: { key: string; expiresAt: string | null } | null;
}

function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (m < 1) return rtf.format(0, "second");
  if (m < 60) return rtf.format(-m, "minute");
  const h = Math.floor(m / 60);
  if (h < 24) return rtf.format(-h, "hour");
  return rtf.format(-Math.floor(h / 24), "day");
}

export function EaCard({ id, name, tf, accent, ex5, set, guide, license }: EaCardProps) {
  const { locale } = useLocale();
  const c = DASHBOARD_COPY[locale].eaCard;
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DevicesState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [activating, setActivating] = useState(false);
  const [actErr, setActErr] = useState<string | null>(null);
  const act = ACTIVATE_COPY[locale] ?? ACTIVATE_COPY.en;

  // TiGold free activation: mint a per-account connect code, then open the bot
  // deep-link so the bot binds the license to THIS account (no email typing).
  const activate = useCallback(async () => {
    setActivating(true);
    setActErr(null);
    try {
      const res = await fetch("/api/telegram/connect", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok || !body?.connectCode) throw new Error();
      const bot = String(body.botUsername || "@dralvo_bot").replace(/^@/, "");
      window.open(`https://t.me/${bot}?start=${body.connectCode}`, "_blank", "noopener,noreferrer");
    } catch {
      setActErr(act.err);
    } finally {
      setActivating(false);
    }
  }, [act.err]);

  const copyKey = useCallback(() => {
    if (!license) return;
    navigator.clipboard.writeText(license.key).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }, [license]);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/license-devices?product=${id}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      if (body.hasLicense === false) {
        setData({ maxAccounts: 0, preBound: null, devices: [] });
      } else {
        setData({
          maxAccounts: body.maxAccounts ?? 0,
          preBound: body.preBound ?? null,
          devices: body.devices ?? [],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : c.loadError);
    } finally {
      setLoading(false);
    }
  }, [id, c.loadError]);

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next && !data) void loadDevices();
  }, [open, data, loadDevices]);

  async function mutate(method: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/user/license-devices", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: id, ...payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      await loadDevices();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : c.opFailed);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addAccount() {
    if (!/^\d{4,12}$/.test(newAccount.trim())) {
      setError(c.invalidAccount);
      return;
    }
    if (await mutate("POST", { mt5_account: newAccount.trim() })) setNewAccount("");
  }

  async function saveEdit(oldAccount: string) {
    if (!/^\d{4,12}$/.test(editValue.trim())) {
      setError(c.invalidAccount);
      return;
    }
    if (await mutate("PATCH", { oldAccount, newAccount: editValue.trim() })) setEditing(null);
  }

  const used = data ? data.devices.length + (data.preBound ? 1 : 0) : 0;
  const max = data?.maxAccounts ?? 0;
  const canAdd = !!data && !data.preBound && data.devices.length < max;

  return (
    <div
      className="card-elevate rounded-2xl border bg-card p-5"
      style={{ borderColor: `${accent}55` }}
    >
      {/* Header: logo + name */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <EaLogo ea={id} size={46} />
          <div className="min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{name}</h3>
            <p className="text-xs text-text-muted">{tf}</p>
          </div>
        </div>
        <span
          className="shrink-0 text-[10px] font-mono font-bold px-2 py-1 rounded-md"
          style={{ background: `${accent}1a`, border: `1px solid ${accent}40`, color: accent }}
        >
          {tf.split(" ")[0]}
        </span>
      </div>

      {/* License key */}
      {license ? (
        <div className="mb-3 rounded-xl border border-border bg-deep/40 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] uppercase tracking-[0.08em] text-text-muted">{c.licenseKey}</p>
            <button
              type="button"
              onClick={copyKey}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                copied ? "text-green" : "text-text-muted hover:text-text-primary hover:bg-gold/5",
              )}
              aria-label={c.copyAria}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? c.copied : c.copy}
            </button>
          </div>
          <code className="block text-[11px] font-mono text-text-secondary break-all">{license.key}</code>
          <p className="text-[11px] text-text-muted mt-1.5">
            {c.expires}: {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString(locale) : c.forever}
          </p>
        </div>
      ) : id === "tigold" ? (
        <div
          className="mb-3 rounded-xl border px-3 py-3"
          style={{
            borderColor: `${accent}66`,
            background: `${accent}0d`,
            boxShadow: `0 0 0 1px ${accent}22, 0 10px 34px -14px ${accent}77`,
          }}
        >
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: accent }} />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary">{c.noKey}</p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{act.hint}</p>
            </div>
          </div>
          <div className="flex justify-center my-1">
            <ChevronsDown className="h-4 w-4 animate-bounce" style={{ color: accent }} aria-hidden />
          </div>
          <button
            type="button"
            onClick={() => void activate()}
            disabled={activating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#060609] disabled:opacity-60 transition-transform hover:scale-[1.02]"
            style={{ background: accent }}
          >
            {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {activating ? act.opening : act.btn}
          </button>
          {actErr && <p className="text-[11px] text-red mt-1.5 text-center">{actErr}</p>}
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-dashed border-border bg-deep/20 px-3 py-2.5">
          <p className="text-[11px] text-text-muted">
            {c.noKey}{" "}
            <a href="https://t.me/dralvoea" target="_blank" rel="noreferrer" className="text-gold hover:underline">
              {c.contactAdmin}
            </a>
          </p>
        </div>
      )}

      {/* Downloads */}
      <div className="flex flex-wrap gap-2">
        <a href={ex5} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15 no-underline transition-colors">
          {c.downloadEx5}
        </a>
        {set && (
          <a href={set} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-card border border-border text-text-secondary hover:text-text-primary no-underline transition-colors">
            {c.downloadSet}
          </a>
        )}
        {guide && (
          <a href={guide} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-card border border-border text-text-muted hover:text-text-primary no-underline transition-colors">
            {c.guide}
          </a>
        )}
      </div>

      {/* Accounts manager toggle */}
      {license && (
        <>
          <button
            type="button"
            onClick={toggle}
            className="mt-3 w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-deep/30 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <MonitorSmartphone className="h-3.5 w-3.5" style={{ color: accent }} />
              {c.connectedAccounts}
              {data && <span className="text-text-muted">· {used}/{max || (data.preBound ? 1 : max)}</span>}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="mt-2 rounded-lg border border-border bg-deep/20 p-3">
              {loading ? (
                <p className="flex items-center gap-2 text-xs text-text-muted py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {c.loading}
                </p>
              ) : (
                <>
                  {/* Pre-bound (IB) single account */}
                  {data?.preBound && (
                    <div className="flex items-center justify-between gap-2 rounded-md bg-card px-2.5 py-2 mb-1.5">
                      <span className="inline-flex items-center gap-2 text-sm font-mono text-text-primary">
                        <ShieldCheck className="h-3.5 w-3.5 text-green" />
                        {data.preBound}
                      </span>
                      <span className="text-[10px] text-text-muted">{c.fixedViaIb}</span>
                    </div>
                  )}

                  {/* Device list */}
                  {data?.devices.length === 0 && !data.preBound && (
                    <p className="text-xs text-text-muted py-1.5">
                      {c.noAccounts}
                    </p>
                  )}

                  <ul className="flex flex-col gap-1.5">
                    {data?.devices.map((d) => (
                      <li
                        key={d.mt5_account}
                        className="flex items-center justify-between gap-2 rounded-md bg-card px-2.5 py-2"
                      >
                        {editing === d.mt5_account ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              inputMode="numeric"
                              className="min-w-0 flex-1 rounded bg-deep border border-border px-2 py-1 text-sm font-mono text-text-primary outline-none"
                              placeholder={c.accountPlaceholder}
                            />
                            <button type="button" disabled={busy} onClick={() => saveEdit(d.mt5_account)} className="p-1 text-green hover:bg-green/10 rounded" aria-label={c.save}>
                              <Check className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setEditing(null)} className="p-1 text-text-muted hover:bg-surface rounded" aria-label={c.cancel}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2 shrink-0">
                                  {d.active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />}
                                  <span className={cn("relative inline-flex rounded-full h-2 w-2", d.active ? "bg-green" : "bg-text-muted/50")} />
                                </span>
                                <span className="text-sm font-mono text-text-primary truncate">{d.mt5_account}</span>
                              </div>
                              <p className="text-[10px] text-text-muted mt-0.5 ml-4">
                                {d.active ? c.runningEa : `${c.offline} · ${timeAgo(d.last_seen, locale)}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => { setEditing(d.mt5_account); setEditValue(d.mt5_account); setError(null); }}
                                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface rounded"
                                aria-label={c.editAria}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => mutate("DELETE", { mt5_account: d.mt5_account })}
                                className="p-1.5 text-text-muted hover:text-red hover:bg-red/10 rounded"
                                aria-label={c.deleteAria}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Add account */}
                  {canAdd && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        value={newAccount}
                        onChange={(e) => setNewAccount(e.target.value)}
                        inputMode="numeric"
                        placeholder={c.addPlaceholder}
                        className="min-w-0 flex-1 rounded-md bg-deep border border-border px-2.5 py-1.5 text-sm font-mono text-text-primary outline-none placeholder:text-text-muted placeholder:font-sans"
                        onKeyDown={(e) => { if (e.key === "Enter") void addAccount(); }}
                      />
                      <button
                        type="button"
                        disabled={busy || !newAccount.trim()}
                        onClick={() => void addAccount()}
                        className="inline-flex items-center gap-1 rounded-md bg-gold/10 border border-gold/20 px-2.5 py-1.5 text-xs font-semibold text-gold hover:bg-gold/15 disabled:opacity-50 transition-colors"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        {c.add}
                      </button>
                    </div>
                  )}
                  {!data?.preBound && max > 0 && data && data.devices.length >= max && (
                    <p className="text-[10px] text-text-muted mt-2">
                      {c.maxReached.replace("{max}", String(max))}
                    </p>
                  )}

                  {error && <p className="text-[11px] text-red mt-2">{error}</p>}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
