"use client";

/**
 * Admin → License module.
 * List / search every license key, create new keys, edit all fields
 * (plan, product, expiry, lifetime, max_accounts, MT5 account, regenerate key),
 * delete keys, and inspect / unbind activated MT5 devices.
 */
import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  X,
  Monitor,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { planLabel } from "@/components/admin/admin-ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

const PRODUCTS = ["goldmaster", "goldscalp", "tigold", "goldwave"] as const;
const PLANS = ["tigold", "unlimited"] as const;

interface Device {
  id: string;
  mt5_account: string;
  first_seen: string;
  last_seen: string;
}

interface License {
  id: string;
  user_id: string;
  email: string | null;
  plan: string;
  product: string;
  key: string;
  mt5_account: string | null;
  expires_at: string | null;
  is_lifetime: boolean;
  max_accounts: number;
  managed_by: string | null;
  created_at: string;
  devices: Device[];
  device_count: number;
}

interface EditForm {
  product: string;
  plan: string;
  maxAccounts: number;
  expiresAt: string; // YYYY-MM-DD or ""
  isLifetime: boolean;
  mt5Account: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const toISO = (d: string) => (d ? `${d}T00:00:00Z` : null);
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—");

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function LicensesTab() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const limit = 25;

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2500);
  };

  const load = (q = search, p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (q) params.set("q", q);
    fetch(`/api/admin/licenses?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setLicenses(d.licenses ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => flash("Tải danh sách thất bại", false))
      .finally(() => setLoading(false));
  };

  // Re-fetch on page change only; search is triggered explicitly via the button.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(search, page); }, [page]);

  const handleSearch = () => {
    setPage(1);
    load(search, 1);
  };

  const post = async (payload: Record<string, unknown>): Promise<boolean> => {
    const r = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (d.success) return true;
    flash(d.error ?? "Lỗi", false);
    return false;
  };

  const copyKey = (id: string, key: string) => {
    navigator.clipboard?.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa key này? Không thể hoàn tác.")) return;
    if (await post({ action: "delete", id })) {
      flash("Đã xóa key");
      load();
    }
  };

  const removeDevice = async (deviceId: string) => {
    if (!confirm("Gỡ tài khoản MT5 này khỏi key?")) return;
    if (await post({ action: "remove_device", deviceId })) {
      flash("Đã gỡ tài khoản MT5");
      load();
    }
  };

  const addDevice = async (licenseId: string, mt5Account: string) => {
    if (await post({ action: "add_device", licenseId, mt5Account })) {
      flash("Đã thêm tài khoản MT5");
      load();
    }
  };

  const editDevice = async (deviceId: string, mt5Account: string) => {
    if (await post({ action: "edit_device", deviceId, mt5Account })) {
      flash("Đã sửa tài khoản MT5");
      load();
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-text-primary">License keys</h2>
        <p className="text-sm text-text-muted">
          Quản lý, tìm kiếm và cấp license cho EA. Tạo key đơn lẻ hoặc gói VIP, chỉnh sửa hạn dùng và gỡ tài khoản MT5 đã đăng ký.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm email / product / MT5 / key..."
            className="min-w-0 flex-1 sm:flex-none sm:w-72 rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted"
          />
          <button onClick={handleSearch} className="rounded-md bg-gold text-[#060609] text-sm font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform">
            <Search size={15} className="inline mr-1" />Tìm
          </button>
        </div>
        <button
          onClick={() => { setShowCreate((s) => !s); setEditingId(null); }}
          className="ml-auto rounded-md bg-gold-bright text-[#060609] text-sm font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform"
        >
          <Plus size={15} className="inline mr-1" />Tạo key
        </button>
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-green" : "text-red"}`}>{msg.text}</p>
      )}

      {/* Create form */}
      {showCreate && (
        <CreateForm
          onCancel={() => setShowCreate(false)}
          onCreated={(summary) => {
            setShowCreate(false);
            flash(summary);
            load();
          }}
        />
      )}

      {/* Table */}
      {loading ? (
        <p className="text-text-muted text-sm">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.05em] text-text-muted border-b border-border">
                <th className="text-left font-semibold py-3.5 px-4 border-r border-border">Email</th>
                <th className="text-left font-semibold py-3.5 px-4 border-r border-border">Product</th>
                <th className="text-left font-semibold py-3.5 px-4 border-r border-border">Plan</th>
                <th className="text-left font-semibold py-3.5 px-4 border-r border-border">Key</th>
                <th className="text-left font-semibold py-3.5 px-4 border-r border-border">Expiry</th>
                <th className="text-center font-semibold py-3.5 px-4 border-r border-border">∞</th>
                <th className="text-center font-semibold py-3.5 px-4 border-r border-border">Devices</th>
                <th className="text-center font-semibold py-3.5 px-4 border-r border-border">Max</th>
                <th className="text-right font-semibold py-3.5 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((l) => (
                <FragmentRow
                  key={l.id}
                  l={l}
                  isEditing={editingId === l.id}
                  isExpanded={expandedId === l.id}
                  copied={copiedId === l.id}
                  onEdit={() => { setEditingId(editingId === l.id ? null : l.id); setShowCreate(false); }}
                  onExpand={() => setExpandedId(expandedId === l.id ? null : l.id)}
                  onCopy={() => copyKey(l.id, l.key)}
                  onDelete={() => remove(l.id)}
                  onRemoveDevice={removeDevice}
                  onAddDevice={addDevice}
                  onEditDevice={editDevice}
                  onSaved={() => { setEditingId(null); flash("Đã lưu thay đổi"); load(); }}
                  post={post}
                />
              ))}
              {licenses.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-sm text-text-muted">Không có license nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{total} key · trang {page}/{totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border px-3 py-1 cursor-pointer disabled:opacity-40 bg-transparent text-text-primary">Trước</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border px-3 py-1 cursor-pointer disabled:opacity-40 bg-transparent text-text-primary">Sau</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row (display + inline edit + device drawer)                               */
/* -------------------------------------------------------------------------- */

function FragmentRow({
  l, isEditing, isExpanded, copied,
  onEdit, onExpand, onCopy, onDelete, onRemoveDevice, onAddDevice, onEditDevice, onSaved, post,
}: {
  l: License;
  isEditing: boolean;
  isExpanded: boolean;
  copied: boolean;
  onEdit: () => void;
  onExpand: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onRemoveDevice: (deviceId: string) => void;
  onAddDevice: (licenseId: string, mt5Account: string) => void;
  onEditDevice: (deviceId: string, mt5Account: string) => void;
  onSaved: () => void;
  post: (p: Record<string, unknown>) => Promise<boolean>;
}) {
  const expired = !l.is_lifetime && l.expires_at && new Date(l.expires_at) < new Date();
  return (
    <>
      <tr className="border-t border-border">
        <td className="py-3 px-4 text-sm text-text-primary max-w-[180px] truncate border-r border-border" title={l.email ?? l.user_id}>{l.email ?? "—"}</td>
        <td className="py-3 px-4 text-sm text-text-secondary border-r border-border">{l.product}</td>
        <td className="py-3 px-4 border-r border-border">
          <span className={`text-sm font-medium ${l.plan === "unlimited" ? "text-green" : "text-gold"}`}>{planLabel(l.plan)}</span>
        </td>
        <td className="py-3 px-4 border-r border-border">
          <button onClick={onCopy} title={l.key} className="flex items-center gap-1.5 font-mono text-[13px] text-text-secondary hover:text-text-primary cursor-pointer border-none bg-transparent">
            {l.key.slice(0, 8)}…
            {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
          </button>
        </td>
        <td className={`py-3 px-4 text-sm border-r border-border ${expired ? "text-red" : "text-text-muted"}`}>
          {l.is_lifetime ? "∞" : fmtDate(l.expires_at)}
        </td>
        <td className="py-3 px-4 text-center border-r border-border">{l.is_lifetime ? <Check size={15} className="inline text-green" /> : <X size={15} className="inline text-text-muted" />}</td>
        <td className="py-3 px-4 text-center border-r border-border">
          <button onClick={onExpand} className="text-sm text-text-secondary hover:text-gold cursor-pointer border-none bg-transparent">
            <Monitor size={14} className="inline mr-1" />{l.device_count}/{l.max_accounts}
          </button>
        </td>
        <td className="py-3 px-4 text-center font-mono text-sm text-text-secondary border-r border-border">{l.max_accounts}</td>
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-3">
            <button onClick={onEdit} className="text-sm text-gold hover:underline border-none bg-transparent cursor-pointer">
              <Pencil size={14} className="inline mr-1" />Sửa
            </button>
            <button onClick={onDelete} className="text-sm text-red hover:underline border-none bg-transparent cursor-pointer">
              <Trash2 size={14} className="inline mr-1" />Xóa
            </button>
          </div>
        </td>
      </tr>

      {/* Device drawer — manage MT5 accounts registered to this key */}
      {isExpanded && (
        <tr className="border-t border-border bg-deep/40">
          <td colSpan={9} className="px-4 py-3">
            <DeviceManager
              l={l}
              onAdd={onAddDevice}
              onEdit={onEditDevice}
              onRemove={onRemoveDevice}
            />
          </td>
        </tr>
      )}

      {/* Inline edit */}
      {isEditing && (
        <tr className="border-t border-border bg-card">
          <td colSpan={9} className="px-4 py-4">
            <EditRow l={l} onSaved={onSaved} post={post} />
          </td>
        </tr>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Device manager — MT5 accounts registered to a key                         */
/* -------------------------------------------------------------------------- */

function DeviceManager({
  l, onAdd, onEdit, onRemove,
}: {
  l: License;
  onAdd: (licenseId: string, mt5Account: string) => void;
  onEdit: (deviceId: string, mt5Account: string) => void;
  onRemove: (deviceId: string) => void;
}) {
  const [newAcct, setNewAcct] = useState("");
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const full = l.device_count >= l.max_accounts;

  const submitAdd = () => {
    const v = newAcct.trim();
    if (!v) return;
    onAdd(l.id, v);
    setNewAcct("");
  };
  const submitEdit = () => {
    const v = editVal.trim();
    if (!v || !editingDevice) return;
    onEdit(editingDevice, v);
    setEditingDevice(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.06em] font-semibold text-text-muted">
        Tài khoản MT5 đã đăng ký ({l.device_count}/{l.max_accounts})
      </p>

      {l.devices.length === 0 ? (
        <p className="text-text-muted text-sm">Chưa có tài khoản MT5 nào.</p>
      ) : (
        <div className="space-y-2">
          {l.devices.map((d) => (
            <div key={d.id} className="flex items-center gap-3 text-sm flex-wrap">
              {editingDevice === d.id ? (
                <>
                  <input
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitEdit(); if (e.key === "Escape") setEditingDevice(null); }}
                    autoFocus
                    className="font-mono text-sm rounded-md border border-border bg-deep px-2 py-1.5 text-text-primary w-36"
                  />
                  <button onClick={submitEdit} className="text-sm text-green hover:underline border-none bg-transparent cursor-pointer">
                    <Check size={13} className="inline" /> Lưu
                  </button>
                  <button onClick={() => setEditingDevice(null)} className="text-sm text-text-muted hover:underline border-none bg-transparent cursor-pointer">Hủy</button>
                </>
              ) : (
                <>
                  <span className="font-mono text-[13px] text-text-primary w-36">{d.mt5_account}</span>
                  <span className="text-text-muted">lần đầu {fmtDate(d.first_seen)}</span>
                  <span className="text-text-muted">gần nhất {fmtDate(d.last_seen)}</span>
                  <div className="ml-auto flex items-center gap-3">
                    <button onClick={() => { setEditingDevice(d.id); setEditVal(d.mt5_account); }} className="text-sm text-gold hover:underline border-none bg-transparent cursor-pointer">
                      <Pencil size={13} className="inline mr-1" />Sửa
                    </button>
                    <button onClick={() => onRemove(d.id)} className="text-sm text-red hover:underline border-none bg-transparent cursor-pointer">
                      <X size={13} className="inline mr-1" />Gỡ
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new MT5 account */}
      <div className="flex items-center gap-2 pt-1">
        <input
          value={newAcct}
          onChange={(e) => setNewAcct(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitAdd()}
          placeholder="Số tài khoản MT5..."
          disabled={full}
          className="font-mono rounded-md border border-border bg-deep px-2 py-1.5 text-sm text-text-primary w-44 placeholder:text-text-muted disabled:opacity-40"
        />
        <button
          onClick={submitAdd}
          disabled={!newAcct.trim() || full}
          title={full ? "Đã đạt giới hạn Max accounts — tăng giới hạn trước" : undefined}
          className="text-sm px-2.5 py-1.5 rounded border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={13} className="inline mr-1" />Thêm MT5
        </button>
        {full && <span className="text-sm text-text-muted">Đã đạt giới hạn {l.max_accounts} tài khoản</span>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Edit form                                                                 */
/* -------------------------------------------------------------------------- */

function EditRow({
  l, onSaved, post,
}: {
  l: License;
  onSaved: () => void;
  post: (p: Record<string, unknown>) => Promise<boolean>;
}) {
  const [form, setForm] = useState<EditForm>({
    product: l.product,
    plan: l.plan,
    maxAccounts: l.max_accounts,
    expiresAt: toDateInput(l.expires_at),
    isLifetime: l.is_lifetime,
    mt5Account: l.mt5_account ?? "",
  });
  const [saving, setSaving] = useState(false);

  const save = async (regenerateKey = false) => {
    setSaving(true);
    const ok = await post({
      action: "update",
      id: l.id,
      product: form.product,
      plan: form.plan,
      maxAccounts: form.maxAccounts,
      expiresAt: form.isLifetime ? null : toISO(form.expiresAt),
      isLifetime: form.isLifetime,
      mt5Account: form.mt5Account || null,
      regenerateKey,
    });
    setSaving(false);
    if (ok) onSaved();
  };

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Product">
          <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className={selectCls}>
            {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Plan">
          <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className={selectCls}>
            {PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
          </select>
        </Field>
        <Field label="Max accounts">
          <input type="number" min={1} value={form.maxAccounts} onChange={(e) => setForm({ ...form, maxAccounts: Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="Expiry">
          <input type="date" value={form.expiresAt} disabled={form.isLifetime} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={`${inputCls} disabled:opacity-40`} />
        </Field>
        <Field label="MT5 account (tigold)">
          <input value={form.mt5Account} onChange={(e) => setForm({ ...form, mt5Account: e.target.value })} placeholder="vd 12345678" className={inputCls} />
        </Field>
        <Field label="Lifetime (∞)">
          <button onClick={() => setForm({ ...form, isLifetime: !form.isLifetime })} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${form.isLifetime ? "bg-green" : "bg-border"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.isLifetime ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </Field>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => save(false)} disabled={saving} className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-4 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-60">
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
        <button onClick={() => { if (confirm("Tạo lại key mới? Key cũ sẽ ngừng hoạt động ngay.")) save(true); }} disabled={saving} className="rounded-md border border-border text-text-secondary text-xs font-medium px-3 py-1.5 cursor-pointer bg-transparent hover:text-text-primary">
          <RefreshCw size={12} className="inline mr-1" />Tạo lại key
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Create form                                                               */
/* -------------------------------------------------------------------------- */

function CreateForm({
  onCancel, onCreated,
}: {
  onCancel: () => void;
  onCreated: (summary: string) => void;
}) {
  // VIP = grant all 3 EAs at once (plan unlimited). Default on — it's the
  // common grant and the reason single-product create felt "broken".
  const [vip, setVip] = useState(true);
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState<string>("goldmaster");
  const [plan, setPlan] = useState<string>("unlimited");
  const [maxAccounts, setMaxAccounts] = useState(2);
  const [expiresAt, setExpiresAt] = useState("");
  const [isLifetime, setIsLifetime] = useState(false);
  const [mt5Account, setMt5Account] = useState("");
  const [saving, setSaving] = useState(false);

  // VIP bundle is always the unlimited plan across all EAs.
  const effectivePlan = vip ? "unlimited" : plan;

  const create = async () => {
    if (!email.trim()) return;
    setSaving(true);
    const r = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        email: email.trim(),
        allProducts: vip,
        product: vip ? undefined : product,
        plan: effectivePlan,
        // VIP uses per-EA default max_accounts; single create uses the field.
        maxAccounts: vip ? undefined : maxAccounts,
        expiresAt: isLifetime ? null : toISO(expiresAt),
        isLifetime,
        mt5Account: vip ? null : mt5Account || null,
      }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.success) {
      onCreated(vip ? `Đã cấp gói VIP (3 EA) cho ${email.trim()}` : `Đã tạo key ${product}: ${(d.key ?? "").slice(0, 8)}…`);
    } else {
      alert(d.error ?? "Lỗi tạo key");
    }
  };

  return (
    <div className="rounded-xl border border-gold/40 bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-gold" />
        <h3 className="text-sm font-semibold text-text-primary">Tạo license key mới</h3>
        <button onClick={onCancel} className="ml-auto text-text-muted hover:text-text-primary cursor-pointer border-none bg-transparent"><X size={16} /></button>
      </div>

      {/* Mode switch: VIP bundle vs single EA */}
      <div className="flex gap-1 rounded-lg border border-border bg-deep p-1 w-fit">
        <button onClick={() => setVip(true)} className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors ${vip ? "bg-gold text-[#060609]" : "bg-transparent text-text-muted hover:text-text-primary"}`}>
          Gói VIP (cả 3 EA)
        </button>
        <button onClick={() => setVip(false)} className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer border-none transition-colors ${!vip ? "bg-gold text-[#060609]" : "bg-transparent text-text-muted hover:text-text-primary"}`}>
          1 EA cụ thể
        </button>
      </div>
      {vip && (
        <p className="text-sm text-text-muted">
          Tạo đồng thời key cho tất cả EA <span className="font-mono text-text-secondary">goldmaster</span>, <span className="font-mono text-text-secondary">goldscalp</span>, <span className="font-mono text-text-secondary">tigold</span>, <span className="font-mono text-text-secondary">goldwave</span> (plan <span className="text-green">unlimited</span>, cùng hạn dùng). Chạy lại sẽ bổ sung EA còn thiếu, giữ nguyên key đã có.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Email user *">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com" className={inputCls} />
        </Field>
        {!vip && (
          <Field label="Product">
            <select value={product} onChange={(e) => setProduct(e.target.value)} className={selectCls}>
              {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        )}
        {!vip && (
          <Field label="Plan">
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className={selectCls}>
              {PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
            </select>
          </Field>
        )}
        {!vip && (
          <Field label="Max accounts">
            <input type="number" min={1} value={maxAccounts} onChange={(e) => setMaxAccounts(Number(e.target.value))} className={inputCls} />
          </Field>
        )}
        <Field label="Expiry">
          <input type="date" value={expiresAt} disabled={isLifetime} onChange={(e) => setExpiresAt(e.target.value)} className={`${inputCls} disabled:opacity-40`} />
        </Field>
        {!vip && (
          <Field label="MT5 account (tigold)">
            <input value={mt5Account} onChange={(e) => setMt5Account(e.target.value)} placeholder="vd 12345678" className={inputCls} />
          </Field>
        )}
        <Field label="Lifetime (∞)">
          <button onClick={() => setIsLifetime(!isLifetime)} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${isLifetime ? "bg-green" : "bg-border"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isLifetime ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </Field>
      </div>
      <div className="flex gap-2">
        <button onClick={create} disabled={saving || !email.trim()} className="rounded-md bg-gold-bright text-[#060609] text-sm font-semibold px-5 py-2 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-60">
          {saving ? "Đang tạo..." : vip ? "Cấp gói VIP" : "Tạo key"}
        </button>
        <button onClick={onCancel} className="rounded-md border border-border text-text-secondary text-sm font-medium px-4 py-2 cursor-pointer bg-transparent hover:text-text-primary">Hủy</button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small shared bits                                                         */
/* -------------------------------------------------------------------------- */

const inputCls = "w-full rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary font-mono placeholder:text-text-muted";
const selectCls = "w-full rounded-md border border-border bg-deep px-2 py-1.5 text-sm text-text-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.06em] text-text-muted block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
