"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Loading, ErrorState, Empty } from "@/components/admin/admin-ui";
import { SUPPORTED_LOCALES, LOCALE_LABELS, type SupportedLocale } from "@/lib/i18n";

type SystemNotif = {
  id: string;
  title: string;
  body: string | null;
  level: string;
  href: string | null;
  audience: string;
  user_id: string | null;
  expires_at: string | null;
  created_at: string;
};

const LEVELS = [
  { value: "info", label: "Thông tin" },
  { value: "success", label: "Thành công" },
  { value: "warning", label: "Cảnh báo" },
  { value: "promo", label: "Khuyến mãi" },
];
const AUDIENCES = [
  { value: "all", label: "Tất cả" },
  { value: "vip", label: "VIP" },
  { value: "free", label: "Free" },
  { value: "user", label: "1 người dùng" },
];

const levelColor: Record<string, string> = {
  info: "text-text-secondary border-border",
  success: "text-green border-green/30",
  warning: "text-red border-red/30",
  promo: "text-gold border-gold/30",
};

/** Icon + accent tile for the live preview, matching the user-facing bell. */
function levelVisual(level: string): { icon: React.ReactNode; tile: string } {
  switch (level) {
    case "success":
      return { icon: <CheckCircle2 className="h-3.5 w-3.5" />, tile: "bg-green/10 text-green" };
    case "warning":
      return { icon: <AlertTriangle className="h-3.5 w-3.5" />, tile: "bg-red/10 text-red" };
    case "promo":
      return { icon: <Sparkles className="h-3.5 w-3.5" />, tile: "bg-gold/10 text-gold" };
    default:
      return { icon: <Info className="h-3.5 w-3.5" />, tile: "bg-text-muted/10 text-text-secondary" };
  }
}

export function SystemNotificationsManager({ canManage = false }: { canManage?: boolean }) {
  const [items, setItems] = useState<SystemNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState("info");
  const [audience, setAudience] = useState("all");
  const [userId, setUserId] = useState("");
  const [href, setHref] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showInTicker, setShowInTicker] = useState(true);
  const [titleI18n, setTitleI18n] = useState<Record<string, string>>({});
  const [bodyI18n, setBodyI18n] = useState<Record<string, string>>({});
  const [activeLoc, setActiveLoc] = useState<SupportedLocale | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/system-notifications")
      .then(async (r) => {
        if (!r.ok) throw new Error("Không tải được thông báo hệ thống.");
        return r.json();
      })
      .then((d) => setItems(d.notifications ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const needsUserId = audience === "user";
  const userIdMissing = needsUserId && !userId.trim();
  const canSubmit = !!title.trim() && !userIdMissing && !posting;

  const submit = async () => {
    if (!title.trim()) return;
    setPosting(true);
    setPostError(null);
    const r = await fetch("/api/admin/system-notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim() || undefined,
        level,
        audience,
        user_id: audience === "user" ? userId.trim() : undefined,
        href: href.trim() || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        show_in_ticker: showInTicker,
        title_i18n: titleI18n,
        body_i18n: bodyI18n,
      }),
    });
    setPosting(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setPostError(d.error ?? "Không gửi được.");
      return;
    }
    setTitle("");
    setBody("");
    setHref("");
    setExpiresAt("");
    setUserId("");
    setShowInTicker(true);
    setTitleI18n({});
    setBodyI18n({});
    setActiveLoc(null);
    load();
  };

  const remove = async (n: SystemNotif) => {
    if (!window.confirm(`Xoá thông báo "${n.title}"?`)) return;
    await fetch(`/api/admin/system-notifications?id=${n.id}`, { method: "DELETE" });
    load();
  };

  const inputCls =
    "w-full rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold";
  const fieldLabel = "block text-[11px] font-medium uppercase tracking-wide text-text-muted";

  const preview = levelVisual(level);
  const audienceLabel = AUDIENCES.find((a) => a.value === audience)?.label ?? audience;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">Thông báo hệ thống</h3>
        <p className="mt-0.5 text-[11px] text-text-muted">
          Hiển thị trong chuông thông báo của người dùng (theo đối tượng).
        </p>
      </div>

      {canManage && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 card-elevate">
          {/* Content */}
          <div className="space-y-1.5">
            <label htmlFor="sysnotif-title" className={fieldLabel}>
              Tiêu đề
            </label>
            <input
              id="sysnotif-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bảo trì hệ thống lúc 2h sáng"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="sysnotif-body" className={fieldLabel}>
              Nội dung <span className="font-normal normal-case text-text-muted">(tuỳ chọn)</span>
            </label>
            <textarea
              id="sysnotif-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Mô tả chi tiết hiển thị dưới tiêu đề"
              rows={2}
              className={`${inputCls} resize-y`}
            />
          </div>

          {/* Level — chips */}
          <div className="space-y-1.5">
            <span className={fieldLabel}>Mức độ</span>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => {
                const active = level === l.value;
                return (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    aria-pressed={active}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      active
                        ? `${levelColor[l.value] ?? levelColor.info} bg-deep`
                        : "border-border text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audience — chips */}
          <div className="space-y-1.5">
            <span className={fieldLabel}>Đối tượng</span>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCES.map((a) => {
                const active = audience === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAudience(a.value)}
                    aria-pressed={active}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      active
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-border text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {needsUserId && (
            <div className="space-y-1.5">
              <label htmlFor="sysnotif-userid" className={fieldLabel}>
                User ID
              </label>
              <input
                id="sysnotif-userid"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user_id (UUID)"
                aria-invalid={userIdMissing}
                className={`${inputCls} font-mono ${
                  userIdMissing ? "border-red/50 focus-visible:border-red focus-visible:ring-red" : ""
                }`}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="sysnotif-href" className={fieldLabel}>
                Link <span className="font-normal normal-case text-text-muted">(tuỳ chọn)</span>
              </label>
              <input
                id="sysnotif-href"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="vd /pricing"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sysnotif-expires" className={fieldLabel}>
                Hết hạn <span className="font-normal normal-case text-text-muted">(tuỳ chọn)</span>
              </label>
              <input
                id="sysnotif-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Ticker placement toggle */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-deep p-3">
            <input
              type="checkbox"
              checked={showInTicker}
              onChange={(e) => setShowInTicker(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-gold"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-text-primary">Hiển thị trên thanh chạy (ticker)</span>
              <span className="block text-[12px] text-text-muted">
                Bật: tin sẽ chạy trên thanh marquee đầu dashboard. Tắt: chỉ hiện trong chuông &amp; trang thông báo.
              </span>
            </span>
          </label>

          {/* Per-locale translations (optional) — fallback to the default above */}
          <div className="space-y-2 rounded-lg border border-border bg-deep p-3">
            <span className={fieldLabel}>
              Bản dịch theo ngôn ngữ <span className="font-normal normal-case text-text-muted">(tuỳ chọn — thiếu thì dùng nội dung mặc định ở trên)</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_LOCALES.map((loc) => {
                const has = !!(titleI18n[loc]?.trim() || bodyI18n[loc]?.trim());
                const active = activeLoc === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setActiveLoc(active ? null : loc)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      active ? "bg-gold text-[#060609]" : "bg-card text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {LOCALE_LABELS[loc]}
                    {has && <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#060609]" : "bg-gold"}`} />}
                  </button>
                );
              })}
            </div>
            {activeLoc && (
              <div className="space-y-2 pt-1">
                <input
                  value={titleI18n[activeLoc] ?? ""}
                  onChange={(e) => setTitleI18n((m) => ({ ...m, [activeLoc]: e.target.value }))}
                  placeholder={`Tiêu đề (${LOCALE_LABELS[activeLoc]})`}
                  maxLength={200}
                  className={inputCls}
                />
                <textarea
                  value={bodyI18n[activeLoc] ?? ""}
                  onChange={(e) => setBodyI18n((m) => ({ ...m, [activeLoc]: e.target.value }))}
                  placeholder={`Nội dung (${LOCALE_LABELS[activeLoc]}) — tuỳ chọn`}
                  rows={2}
                  maxLength={1000}
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Live preview — how the row looks inside the bell */}
          <div className="space-y-1.5">
            <span className={fieldLabel}>Xem trước</span>
            <div className="rounded-lg border border-border bg-deep p-3">
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${preview.tile}`}
                >
                  {preview.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {title.trim() || "Tiêu đề thông báo"}
                  </p>
                  {body.trim() && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{body.trim()}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span
                      className={`rounded border px-1.5 py-0.5 ${levelColor[level] ?? levelColor.info}`}
                    >
                      {LEVELS.find((l) => l.value === level)?.label ?? level}
                    </span>
                    <span className="rounded border border-border px-1.5 py-0.5 text-text-muted">
                      {audienceLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {postError && (
            <p className="flex items-center gap-1.5 text-xs text-red">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {postError}
            </p>
          )}
          {userIdMissing && !postError && (
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Nhập user_id để gửi cho 1 người dùng.
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-gold px-4 py-2 text-sm font-semibold text-[#060609] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" /> {posting ? "Đang gửi..." : "Gửi thông báo"}
          </button>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={load} />
      ) : items.length === 0 ? (
        <Empty text="Chưa có thông báo hệ thống nào." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const v = levelVisual(n.level);
            return (
              <div key={n.id} className="rounded-xl border border-border bg-card p-4 card-elevate">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${v.tile}`}
                    >
                      {v.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-text-secondary">{n.body}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span
                          className={`rounded border px-1.5 py-0.5 ${levelColor[n.level] ?? levelColor.info}`}
                        >
                          {n.level}
                        </span>
                        <span className="rounded border border-border px-1.5 py-0.5 text-text-muted">
                          {n.audience}
                          {n.audience === "user" && n.user_id ? ` · ${n.user_id.slice(0, 8)}…` : ""}
                        </span>
                        {n.expires_at && (
                          <span className="rounded border border-border px-1.5 py-0.5 text-text-muted">
                            hết hạn {new Date(n.expires_at).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                        <span className="text-text-muted">
                          {new Date(n.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => remove(n)}
                      title="Xoá"
                      aria-label={`Xoá thông báo ${n.title}`}
                      className="shrink-0 cursor-pointer rounded-md border-none bg-transparent p-1.5 text-text-muted transition-colors hover:bg-red/10 hover:text-red focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
