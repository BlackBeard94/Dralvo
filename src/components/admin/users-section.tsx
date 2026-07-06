"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Clock,
  XCircle,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  KeyRound,
  UserPlus,
  Trash2,
  X,
} from "lucide-react";
import { Loading, ErrorState, Empty, planLabel } from "@/components/admin/admin-ui";

interface LicenseRow {
  product: string;
  plan: string;
  key: string;
  expires_at: string | null;
  max_accounts: number | null;
}

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  licenses: LicenseRow[];
  subscription: { plan: string; status: string } | null;
  source?: { type: "affiliate" | "partner" | "direct"; label: string };
  trafficSource?: { channel: string; medium: string | null } | null;
}

const PRODUCTS = ["goldmaster", "goldscalp", "tigold", "goldwave"] as const;
const DEFAULT_MAX_ACCOUNTS: Record<string, number> = { goldmaster: 2, goldscalp: 2, tigold: 1 };

type Tier = "VIP" | "TiGold" | "Free";
// Filter only buckets users as VIP vs Free; TiGold (free IB) counts as Free.
type TierFilter = "all" | "VIP" | "Free";
type SubFilter = "all" | "active" | "none";
type EaFilter = "all" | (typeof PRODUCTS)[number];
type SortKey = "email" | "created_at";
type SortDir = "asc" | "desc";

function plusDaysISO(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

/** Derive the user's overall tier from their keys + subscription. */
function deriveTier(u: UserRow): Tier {
  const subActive = u.subscription?.status === "active";
  const hasUnlimited = u.licenses.some((l) => l.plan === "unlimited");
  if (hasUnlimited || (subActive && u.subscription?.plan === "unlimited")) return "VIP";
  if (u.licenses.some((l) => l.product === "tigold" || l.plan === "tigold")) return "TiGold";
  return "Free";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "∞";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function UsersSection({ canEdit = false }: { canEdit?: boolean }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // client-side filters
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [eaFilter, setEaFilter] = useState<EaFilter>("all");
  const [subFilter, setSubFilter] = useState<SubFilter>("all");

  // sort
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // expanded detail rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // create-account form toggle
  const [showCreate, setShowCreate] = useState(false);

  // bulk selection (by user id)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback((q?: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    fetch(`/api/admin/users?${params}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Bạn không có quyền xem người dùng." : "Không tải được danh sách.");
        return r.json();
      })
      .then((d) => { setUsers(d.users ?? []); setSelected(new Set()); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2200);
  };

  const action = async (userId: string, act: string, extra?: Record<string, string | number>) => {
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, userId, ...extra }),
    });
    const d = await r.json();
    if (d.success) {
      flash("Đã cập nhật");
      load(search || undefined);
    } else {
      flash(d.error ?? "Lỗi", false);
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Xóa tài khoản "${email}"?\nToàn bộ license & dữ liệu của user này sẽ bị xóa. Không thể hoàn tác.`)) return;
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_user", userId }),
    });
    const d = await r.json();
    if (d.success) { flash("Đã xóa tài khoản"); load(search || undefined); }
    else flash(d.error ?? "Lỗi", false);
  };

  const createUser = async (email: string, password: string): Promise<boolean> => {
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_user", email, password }),
    });
    const d = await r.json();
    if (d.success) { flash("Đã tạo tài khoản"); load(); return true; }
    flash(d.error ?? "Lỗi tạo tài khoản", false);
    return false;
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const deleteSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Xóa ${ids.length} tài khoản đã chọn?\nToàn bộ license & dữ liệu sẽ bị xóa. Không thể hoàn tác.`)) return;
    const results = await Promise.all(
      ids.map((id) =>
        fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete_user", userId: id }),
        }).then((r) => r.json()).catch(() => ({ error: "network" }))
      )
    );
    const ok = results.filter((r) => r.success).length;
    const fail = ids.length - ok;
    flash(fail ? `Đã xóa ${ok}, bỏ qua ${fail} (admin/chính bạn)` : `Đã xóa ${ok} tài khoản`, fail === 0);
    load(search || undefined);
  };

  const toggleRow = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "email" ? "asc" : "desc");
    }
  };

  const visible = useMemo(() => {
    let rows = users.filter((u) => {
      if (tierFilter === "VIP" && deriveTier(u) !== "VIP") return false;
      if (tierFilter === "Free" && deriveTier(u) === "VIP") return false;
      if (eaFilter !== "all" && !u.licenses.some((l) => l.product === eaFilter)) return false;
      if (subFilter === "active" && u.subscription?.status !== "active") return false;
      if (subFilter === "none" && u.subscription?.status === "active") return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "email") cmp = a.email.localeCompare(b.email);
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [users, tierFilter, eaFilter, subFilter, sortKey, sortDir]);

  const allVisibleSelected = visible.length > 0 && visible.every((u) => selected.has(u.id));
  const toggleSelectAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((u) => next.delete(u.id));
      else visible.forEach((u) => next.add(u.id));
      return next;
    });

  // Per-option match counts for the filter pills (computed over all loaded users)
  // so it's obvious the filter is live and how many users hold each EA / tier.
  const counts = useMemo(() => {
    const tier: Record<string, number> = { all: users.length, VIP: 0, Free: 0 };
    const ea: Record<string, number> = { all: users.length, goldmaster: 0, goldscalp: 0, tigold: 0 };
    const sub: Record<string, number> = { all: users.length, active: 0, none: 0 };
    for (const u of users) {
      if (deriveTier(u) === "VIP") tier.VIP++; else tier.Free++;
      for (const p of PRODUCTS) if (u.licenses.some((l) => l.product === p)) ea[p]++;
      if (u.subscription?.status === "active") sub.active++; else sub.none++;
    }
    return { tier, ea, sub };
  }, [users]);

  const sortIcon = (k: SortKey) => {
    if (sortKey !== k) return <ArrowUpDown size={12} className="inline ml-1 text-text-muted" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="inline ml-1 text-gold" />
    ) : (
      <ArrowDown size={12} className="inline ml-1 text-gold" />
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(search)}
            placeholder="Tìm email..."
            className="rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary w-64 placeholder:text-text-muted"
          />
          <button
            onClick={() => load(search)}
            className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform"
          >
            <Search size={14} className="inline mr-1" />Tìm
          </button>
        </div>

        <FilterGroup
          label="Gói"
          value={tierFilter}
          onChange={(v) => setTierFilter(v as TierFilter)}
          counts={counts.tier}
          options={[
            ["all", "Tất cả"],
            ["VIP", "VIP"],
            ["Free", "Free"],
          ]}
        />
        <FilterGroup
          label="EA đang có"
          value={eaFilter}
          onChange={(v) => setEaFilter(v as EaFilter)}
          counts={counts.ea}
          options={[
            ["all", "Tất cả"],
            ["goldmaster", "goldmaster"],
            ["goldscalp", "goldscalp"],
            ["tigold", "tigold"],
          ]}
        />
        <FilterGroup
          label="Sub"
          value={subFilter}
          onChange={(v) => setSubFilter(v as SubFilter)}
          counts={counts.sub}
          options={[
            ["all", "Tất cả"],
            ["active", "active"],
            ["none", "none"],
          ]}
        />

        {canEdit && (
          <button
            onClick={() => setShowCreate((s) => !s)}
            className="ml-auto self-end rounded-md bg-gold-bright text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform"
          >
            <UserPlus size={14} className="inline mr-1" />Tạo tài khoản
          </button>
        )}
      </div>

      {canEdit && showCreate && (
        <CreateUserForm
          onCancel={() => setShowCreate(false)}
          onCreate={createUser}
          onDone={() => setShowCreate(false)}
        />
      )}

      {msg && <p className={`text-[13px] ${msg.ok ? "text-green" : "text-red"}`}>{msg.text}</p>}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={() => load(search || undefined)} />
      ) : users.length === 0 ? (
        <Empty text="Không có user nào." />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 text-[12px] text-text-muted">
            <span>
              Hiển thị <b className="text-text-secondary">{visible.length}</b> / {users.length} user
              {selected.size > 0 && <span className="ml-2 text-gold">· đã chọn {selected.size}</span>}
            </span>
            {canEdit && selected.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(new Set())}
                  className="rounded-md border border-border text-text-secondary text-[11px] font-medium px-2.5 py-1 cursor-pointer bg-transparent hover:text-text-primary"
                >
                  Bỏ chọn
                </button>
                <button
                  onClick={deleteSelected}
                  className="rounded-md border border-red/30 bg-red/10 text-red text-[11px] font-semibold px-2.5 py-1 cursor-pointer hover:bg-red/20 transition-colors"
                >
                  <Trash2 size={12} className="inline mr-1" />Xóa đã chọn ({selected.size})
                </button>
              </div>
            )}
          </div>

          {/* ── Spreadsheet table ──────────────────────────────── */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[860px] border-collapse text-[13px]">
              <thead>
                <tr className="sticky top-0 z-10 bg-deep text-left text-text-muted">
                  {canEdit && (
                    <th className="w-9 border-r border-border px-2 py-2 text-center font-medium">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="cursor-pointer accent-gold align-middle"
                        title="Chọn tất cả"
                        aria-label="Chọn tất cả"
                      />
                    </th>
                  )}
                  <th className="w-8 border-r border-border px-2 py-2 font-medium"></th>
                  <th
                    className="cursor-pointer select-none border-r border-border px-3 py-2 font-medium hover:text-text-secondary"
                    onClick={() => toggleSort("email")}
                  >
                    Email{sortIcon("email")}
                  </th>
                  <th
                    className="cursor-pointer select-none border-r border-border px-3 py-2 font-medium hover:text-text-secondary"
                    onClick={() => toggleSort("created_at")}
                  >
                    Ngày tạo{sortIcon("created_at")}
                  </th>
                  <th className="border-r border-border px-3 py-2 font-medium">Nguồn</th>
                  <th className="border-r border-border px-3 py-2 font-medium">Traffic</th>
                  <th className="border-r border-border px-3 py-2 font-medium">Sub</th>
                  <th className="border-r border-border px-3 py-2 font-medium">Gói</th>
                  <th className="border-r border-border px-3 py-2 font-medium">EA đang có</th>
                  <th className="border-r border-border px-3 py-2 text-center font-medium">Key</th>
                  <th className="px-3 py-2 text-center font-medium">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 11 : 10} className="px-3 py-8 text-center text-text-muted">
                      Không có user khớp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  visible.map((u, i) => (
                    <UserRows
                      key={u.id}
                      user={u}
                      zebra={i % 2 === 1}
                      open={expanded.has(u.id)}
                      onToggle={() => toggleRow(u.id)}
                      action={action}
                      onDelete={() => deleteUser(u.id, u.email)}
                      selected={selected.has(u.id)}
                      onToggleSelect={() => toggleSelect(u.id)}
                      canEdit={canEdit}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Filter pill group ─────────────────────────────────────── */
function FilterGroup({
  label,
  value,
  onChange,
  options,
  counts,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  /** Optional per-option match count, keyed by option value. */
  counts?: Record<string, number>;
}) {
  return (
    <div className="flex flex-col gap-1 w-full sm:w-auto">
      <span className="text-[10px] uppercase tracking-[0.06em] text-text-muted">{label}</span>
      <div className="flex flex-wrap items-center rounded-md border border-border bg-deep p-0.5">
        {options.map(([val, lbl]) => {
          const active = value === val;
          const n = counts?.[val];
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              className={`rounded px-2.5 py-1 text-[12px] font-medium capitalize cursor-pointer border-none transition-colors ${
                active ? "bg-gold text-[#060609]" : "bg-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {lbl}
              {n != null && (
                <span className={`ml-1 ${active ? "text-[#060609]/70" : "text-text-muted"}`}>({n})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Create-account form ───────────────────────────────────── */
function CreateUserForm({
  onCancel,
  onCreate,
  onDone,
}: {
  onCancel: () => void;
  onCreate: (email: string, password: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) return;
    setSaving(true);
    const ok = await onCreate(email.trim(), password);
    setSaving(false);
    if (ok) { setEmail(""); setPassword(""); onDone(); }
  };

  return (
    <div className="rounded-xl border border-gold/40 bg-card p-4 space-y-3 max-w-2xl">
      <div className="flex items-center gap-2">
        <UserPlus size={16} className="text-gold" />
        <h3 className="text-sm font-semibold text-text-primary">Tạo tài khoản mới</h3>
        <button onClick={onCancel} className="ml-auto text-text-muted hover:text-text-primary cursor-pointer border-none bg-transparent">
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@user.com"
          className="flex-1 rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
        />
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Mật khẩu (≥6 ký tự)"
          className="flex-1 rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted font-mono"
        />
        <button
          onClick={submit}
          disabled={saving || !email.trim() || password.length < 6}
          className="rounded-md bg-gold-bright text-[#060609] text-sm font-semibold px-4 py-2 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
        >
          {saving ? "Đang tạo..." : "Tạo"}
        </button>
      </div>
      <p className="text-[11px] text-text-muted">Tài khoản được xác nhận email sẵn — user có thể đăng nhập / đổi mật khẩu ngay.</p>
    </div>
  );
}

/* ── Tier / EA badge helpers ───────────────────────────────── */
function TierBadge({ tier }: { tier: Tier }) {
  const cls =
    tier === "VIP"
      ? "border-gold/40 bg-gold/10 text-gold"
      : tier === "TiGold"
        ? "border-green/40 bg-green/10 text-green"
        : "border-border bg-deep text-text-muted";
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-[12px] font-semibold ${cls}`}>{tier}</span>
  );
}

function SourceBadge({ source }: { source?: { type: "affiliate" | "partner" | "direct"; label: string } }) {
  if (!source || source.type === "direct") {
    return <span className="text-[12px] text-text-muted">Trực tiếp</span>;
  }
  const cls =
    source.type === "affiliate"
      ? "border-gold/40 bg-gold/10 text-gold"
      : "border-sky-500/40 bg-sky-500/10 text-sky-400";
  return (
    <span className={`inline-block max-w-[160px] truncate rounded border px-2 py-0.5 text-[11px] font-medium ${cls}`} title={source.label}>
      {source.label}
    </span>
  );
}

function TrafficBadge({ traffic }: { traffic?: { channel: string; medium: string | null } | null }) {
  if (!traffic) return <span className="text-[12px] text-text-muted">—</span>;
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="text-[12px] font-medium capitalize text-text-secondary">{traffic.channel}</span>
      {traffic.medium && <span className="text-[10px] text-text-muted">{traffic.medium}</span>}
    </span>
  );
}

function EaBadge({ product }: { product: string }) {
  return (
    <span className="inline-block rounded border border-border bg-deep px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
      {product}
    </span>
  );
}

/* ── One user = a main row + (when open) a detail row ──────── */
function UserRows({
  user,
  zebra,
  open,
  onToggle,
  action,
  onDelete,
  selected,
  onToggleSelect,
  canEdit,
}: {
  user: UserRow;
  zebra: boolean;
  open: boolean;
  onToggle: () => void;
  action: (userId: string, act: string, extra?: Record<string, string | number>) => void;
  onDelete: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  canEdit: boolean;
}) {
  const tier = deriveTier(user);
  const subActive = user.subscription?.status === "active";
  const rowBg = selected ? "bg-gold/10" : zebra ? "bg-deep/40" : "bg-card";

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer divide-x divide-border border-t border-border ${rowBg} hover:bg-gold/5`}
      >
        {canEdit && (
          <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="cursor-pointer accent-gold align-middle"
              aria-label={`Chọn ${user.email}`}
            />
          </td>
        )}
        <td className="px-2 py-2 text-center text-text-muted">
          {open ? <ChevronDown size={15} className="inline" /> : <ChevronRight size={15} className="inline" />}
        </td>
        <td className="px-3 py-2 text-text-primary">{user.email}</td>
        <td className="whitespace-nowrap px-3 py-2 text-text-secondary">{fmtDate(user.created_at)}</td>
        <td className="px-3 py-2"><SourceBadge source={user.source} /></td>
        <td className="px-3 py-2"><TrafficBadge traffic={user.trafficSource} /></td>
        <td className="px-3 py-2">
          <span className={`text-[12px] font-medium ${subActive ? "text-green" : "text-text-muted"}`}>
            {user.subscription?.status ?? "—"}
          </span>
        </td>
        <td className="px-3 py-2">
          <TierBadge tier={tier} />
        </td>
        <td className="px-3 py-2">
          {user.licenses.length === 0 ? (
            <span className="text-[12px] text-text-muted">—</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {user.licenses.map((l) => (
                <EaBadge key={l.product} product={l.product} />
              ))}
            </div>
          )}
        </td>
        <td className="px-3 py-2 text-center font-mono text-text-secondary">{user.licenses.length}</td>
        <td className="px-3 py-2 text-center text-[12px] text-gold">{open ? "Đóng" : "Mở"}</td>
      </tr>

      {open && (
        <tr className={rowBg}>
          <td colSpan={canEdit ? 11 : 10} className="border-t border-border px-4 py-3">
            <DetailPanel user={user} action={action} onDelete={onDelete} canEdit={canEdit} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Expandable detail: per-key management (reuses POST actions) ── */
function DetailPanel({
  user,
  action,
  onDelete,
  canEdit,
}: {
  user: UserRow;
  action: (userId: string, act: string, extra?: Record<string, string | number>) => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const heldProducts = new Set(user.licenses.map((l) => l.product));
  const missing = PRODUCTS.filter((p) => !heldProducts.has(p));

  const extend = (product: string) => {
    const exp = prompt(`Gia hạn key ${product} đến (YYYY-MM-DD):`, plusDaysISO(30));
    if (exp) action(user.id, "extend_license", { product, expiresAt: exp + "T00:00:00Z" });
  };

  const setMax = (product: string, current: number | null) => {
    const v = prompt(`Số tài khoản tối đa cho key ${product}:`, String(current ?? DEFAULT_MAX_ACCOUNTS[product] ?? 1));
    if (v) {
      const n = parseInt(v, 10);
      if (n >= 1) action(user.id, "set_max_accounts", { product, maxAccounts: n });
    }
  };

  const addKey = (product: string) => {
    const exp = prompt(`Cấp key ${product} — hết hạn (YYYY-MM-DD, để trống = vĩnh viễn):`, plusDaysISO(30));
    if (exp === null) return;
    action(user.id, "add_key", {
      product,
      plan: "unlimited",
      maxAccounts: DEFAULT_MAX_ACCOUNTS[product] ?? 1,
      expiresAt: exp ? exp + "T00:00:00Z" : "",
    });
  };

  return (
    <div className="space-y-3">
      {/* Account-level actions */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-text-muted">
          User ID: <code className="font-mono text-text-secondary">{user.id.slice(0, 8)}…</code>
        </span>
        {canEdit && (
          <button
            onClick={onDelete}
            className="rounded-md border border-red/30 bg-red/5 text-red text-[11px] font-semibold px-2.5 py-1 cursor-pointer hover:bg-red/10 transition-colors"
          >
            <Trash2 size={12} className="inline mr-1" />Xóa tài khoản
          </button>
        )}
      </div>

      {user.licenses.length === 0 ? (
        <p className="text-[13px] text-text-muted">Chưa có license key nào.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[640px] border-collapse text-[12px]">
            <thead>
              <tr className="bg-deep text-left text-text-muted">
                <th className="border-r border-border px-3 py-1.5 font-medium">EA</th>
                <th className="border-r border-border px-3 py-1.5 font-medium">Plan</th>
                <th className="border-r border-border px-3 py-1.5 font-medium">Key</th>
                <th className="border-r border-border px-3 py-1.5 font-medium">Hết hạn</th>
                <th className="border-r border-border px-3 py-1.5 font-medium">Max acc</th>
                {canEdit && <th className="px-3 py-1.5 font-medium">Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {user.licenses.map((l) => (
                <tr key={l.product} className="divide-x divide-border border-t border-border">
                  <td className="px-3 py-2 font-semibold capitalize text-text-primary">{l.product}</td>
                  <td className="px-3 py-2">
                    <span className={`font-medium ${l.plan === "unlimited" ? "text-green" : "text-gold"}`}>{planLabel(l.plan)}</span>
                  </td>
                  <td className="px-3 py-2">
                    <code className="block max-w-[180px] truncate font-mono text-text-secondary" title={l.key}>
                      {l.key}
                    </code>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-muted">{fmtDate(l.expires_at)}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">
                    {l.max_accounts ?? DEFAULT_MAX_ACCOUNTS[l.product] ?? 1}
                  </td>
                  {canEdit && (
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setMax(l.product, l.max_accounts)}
                          className="cursor-pointer border-none bg-transparent text-gold hover:underline"
                        >
                          Sửa số TK
                        </button>
                        <button
                          onClick={() => extend(l.product)}
                          className="cursor-pointer border-none bg-transparent text-green hover:underline"
                        >
                          <Clock size={12} className="mr-0.5 inline" />Gia hạn
                        </button>
                        <button
                          onClick={() => action(user.id, "revoke_license", { product: l.product })}
                          className="cursor-pointer border-none bg-transparent text-red hover:underline"
                        >
                          <XCircle size={12} className="mr-0.5 inline" />Thu hồi
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.06em] text-text-muted">
            <KeyRound size={11} className="mr-1 inline" />Cấp key:
          </span>
          {missing.map((p) => (
            <button
              key={p}
              onClick={() => addKey(p)}
              className="cursor-pointer rounded border border-gold/30 bg-gold/5 px-2 py-1 text-[12px] capitalize text-gold hover:bg-gold/10"
            >
              + {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
