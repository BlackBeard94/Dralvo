"use client";

/**
 * Admin Backoffice — 6-tab hub.
 * ponytail: one file, all tabs inline. Move to components when a tab hits 200+ lines.
 */
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Shield,
  Share2,
  Server,
  Search,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type TabId = "overview" | "users" | "finance" | "admins" | "affiliate" | "vps";

interface OverviewStats {
  totalUsers: number;
  unlimitedActive: number;
  tigoldCount: number;
  stripeActiveSubs: number;
  totalStripeRevenue: number;
  pendingCommissions: number;
}

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  license: { plan: string; key: string; expires_at: string | null } | null;
  subscription: { plan: string; status: string } | null;
}

interface Payment {
  id: string;
  date: string;
  email: string | null;
  amount: number;
  currency: string;
  status: string;
}

interface SubAdminRow {
  id: string;
  email: string | null;
  role: string;
  permissions: Record<string, Record<string, boolean>>;
  created_at: string;
}

interface VpsRow {
  id: string;
  user_email: string | null;
  ip: string;
  username: string;
  password: string;
  status: string;
  notes: string | null;
  assigned_by_email: string | null;
  assigned_at: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "finance", label: "Tài chính", icon: DollarSign },
  { id: "vps", label: "VPS", icon: Server },
  { id: "affiliate", label: "Affiliate", icon: Share2 },
  { id: "admins", label: "Quản trị viên", icon: Shield, adminOnly: true },
];

/* -------------------------------------------------------------------------- */
/*  Tab: Overview                                                             */
/* -------------------------------------------------------------------------- */

function OverviewTab({ stats: initialStats, isSuperAdmin }: { stats: OverviewStats | null; isSuperAdmin: boolean }) {
  const [stats, setStats] = useState<OverviewStats | null>(initialStats);

  // ponytail: if parent already loaded stats, use them; otherwise fetch
  useEffect(() => {
    if (initialStats) return;
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [initialStats]);

  if (!stats) return <p className="text-text-muted text-sm">Đang tải...</p>;

  const cards = [
    { label: "Tổng users", value: stats.totalUsers },
    { label: "Unlimited đang active", value: stats.unlimitedActive },
    { label: "TiGold", value: stats.tigoldCount },
    { label: "Stripe subs active", value: stats.stripeActiveSubs },
    { label: "Doanh thu Stripe", value: `$${stats.totalStripeRevenue}` },
    { label: "Affiliate chờ duyệt", value: stats.pendingCommissions },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] tracking-[0.06em] uppercase text-text-muted mb-1">{c.label}</p>
          <p className="text-xl font-semibold font-mono text-text-primary">{c.value}</p>
        </div>
      ))}
    </div>
    <NotificationSection isSuperAdmin={isSuperAdmin} />
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Users                                                                */
/* -------------------------------------------------------------------------- */

function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = (q?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => load(search);

  const action = async (userId: string, act: string, extra?: Record<string, string>) => {
    setMsg(null);
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, userId, ...extra }),
    });
    const d = await r.json();
    if (d.success) {
      setMsg(`${act} — OK`);
      setTimeout(() => setMsg(null), 2000);
      load(search || undefined);
    } else {
      setMsg(d.error ?? "Lỗi");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Tìm email..."
          className="rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary w-64 placeholder:text-text-muted"
        />
        <button onClick={handleSearch} className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform">
          <Search size={14} className="inline mr-1" />Tìm
        </button>
      </div>
      {msg && <p className="text-[12px] text-green">{msg}</p>}
      {loading ? (
        <p className="text-text-muted text-sm">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                <th className="text-left font-medium py-3 px-3">Email</th>
                <th className="text-left font-medium py-3 px-3">License</th>
                <th className="text-left font-medium py-3 px-3">Key</th>
                <th className="text-left font-medium py-3 px-3">Expiry</th>
                <th className="text-left font-medium py-3 px-3">Sub</th>
                <th className="text-right font-medium py-3 px-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-2.5 px-3 text-text-primary">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] font-medium ${u.license?.plan === "unlimited" ? "text-green" : u.license?.plan === "tigold" ? "text-gold" : "text-text-muted"}`}>
                      {u.license?.plan ?? "—"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-text-secondary max-w-[120px] truncate" title={u.license?.key}>
                    {u.license?.key ? u.license.key.slice(0, 12) + "..." : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-[12px] text-text-muted">
                    {u.license?.expires_at ? new Date(u.license.expires_at).toLocaleDateString() : "∞"}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] font-medium ${u.subscription?.status === "active" ? "text-green" : "text-text-muted"}`}>
                      {u.subscription?.status ?? "—"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.license && (
                        <button onClick={() => action(u.id, "revoke_license")} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">
                          <XCircle size={12} className="inline mr-0.5" />Thu hồi
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const exp = prompt("Gia hạn đến (YYYY-MM-DD):", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
                          if (exp) action(u.id, "extend_license", { expiresAt: exp + "T00:00:00Z" });
                        }}
                        className="text-[11px] text-green hover:underline border-none bg-transparent cursor-pointer"
                      >
                        <Clock size={12} className="inline mr-0.5" />Gia hạn
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-text-muted">Không có user nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Finance                                                              */
/* -------------------------------------------------------------------------- */

function FinanceTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState<{ stripeUSD: number }>({ stripeUSD: 0 });
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    fetch(`/api/admin/finance?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setPayments(d.payments ?? []);
        setTotals(d.totals ?? { stripeUSD: 0 });
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[10px] uppercase tracking-[0.06em] text-text-muted block mb-1">Từ</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-border bg-deep px-2 py-1 text-sm text-text-primary" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.06em] text-text-muted block mb-1">Đến</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-border bg-deep px-2 py-1 text-sm text-text-primary" />
        </div>
        <button onClick={load} className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform">
          Lọc
        </button>
      </div>

      {/* Totals */}
      <div className="flex gap-4 text-sm">
        <span className="text-text-muted">Stripe: <span className="text-green font-mono">${totals.stripeUSD}</span></span>
        <span className="text-text-muted">Tổng GD: <span className="text-text-primary">{total}</span></span>
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                <th className="text-left font-medium py-3 px-3">Ngày</th>
                <th className="text-left font-medium py-3 px-3">User</th>
                <th className="text-right font-medium py-3 px-3">Số tiền</th>
                <th className="text-center font-medium py-3 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id || i} className="border-t border-border">
                  <td className="py-2.5 px-3 text-text-secondary">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3 text-text-primary">{p.email ?? "—"}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-green">${p.amount}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[11px] font-medium ${p.status === "active" || p.status === "confirmed" ? "text-green" : "text-text-muted"}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-text-muted">Không có giao dịch nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Admins (super_admin only)                                            */
/* -------------------------------------------------------------------------- */

function AdminsTab() {
  const [subAdmins, setSubAdmins] = useState<SubAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  // New admin form
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("admin");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/sub-admins")
      .then((r) => r.json())
      .then((d) => setSubAdmins(d.subAdmins ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newEmail) return;
    setMsg(null);
    const r = await fetch("/api/admin/sub-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", email: newEmail, role: newRole }),
    });
    const d = await r.json();
    if (d.success) {
      setNewEmail("");
      setMsg("Đã thêm.");
      setTimeout(() => setMsg(null), 2000);
      load();
    } else {
      setMsg(d.error ?? "Lỗi");
    }
  };

  const remove = async (subAdminId: string) => {
    if (!confirm("Xác nhận xóa?")) return;
    await fetch("/api/admin/sub-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", subAdminId }),
    });
    load();
  };

  const togglePerm = async (subAdminId: string, scope: string, perm: string, current: boolean) => {
    const target = subAdmins.find((a) => a.id === subAdminId);
    if (!target) return;
    const newPerms = { ...target.permissions };
    if (!newPerms[scope]) newPerms[scope] = {};
    newPerms[scope][perm] = !current;

    await fetch("/api/admin/sub-admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", subAdminId, permissions: newPerms }),
    });
    load();
  };

  if (loading) return <p className="text-text-muted text-sm">Đang tải...</p>;

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-w-[480px]">
        <h3 className="text-sm font-semibold text-text-primary">Thêm quản trị viên</h3>
        <div className="flex gap-2">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email user..."
            className="flex-1 rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted"
          />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="rounded-md border border-border bg-deep px-2 py-1.5 text-sm text-text-primary">
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
          </select>
          <button onClick={create} className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform">
            Thêm
          </button>
        </div>
      </div>
      {msg && <p className="text-[12px] text-green">{msg}</p>}

      {/* List */}
      {subAdmins.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-medium text-text-primary">{a.email ?? "—"}</span>
              <span className={`ml-2 text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full ${a.role === "super_admin" ? "bg-gold/20 text-gold" : a.role === "admin" ? "bg-green/20 text-green" : "bg-border text-text-muted"}`}>
                {a.role}
              </span>
            </div>
            <button onClick={() => remove(a.id)} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">
              <Trash2 size={12} className="inline mr-0.5" />Xóa
            </button>
          </div>
          {/* Permissions toggle grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {(["users", "finance", "vps", "affiliate", "admins"] as const).map((scope) => (
              <div key={scope} className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.06em] text-text-muted">{scope}</p>
                {scope === "users" && (
                  <div className="flex gap-2">
                    <PermToggle label="View" active={!!a.permissions.users?.view} onChange={() => togglePerm(a.id, "users", "view", !!a.permissions.users?.view)} />
                    <PermToggle label="Edit" active={!!a.permissions.users?.edit} onChange={() => togglePerm(a.id, "users", "edit", !!a.permissions.users?.edit)} />
                  </div>
                )}
                {scope === "finance" && <PermToggle label="View" active={!!a.permissions.finance?.view} onChange={() => togglePerm(a.id, "finance", "view", !!a.permissions.finance?.view)} />}
                {scope === "vps" && <PermToggle label="Manage" active={!!a.permissions.vps?.manage} onChange={() => togglePerm(a.id, "vps", "manage", !!a.permissions.vps?.manage)} />}
                {scope === "affiliate" && <PermToggle label="Manage" active={!!a.permissions.affiliate?.manage} onChange={() => togglePerm(a.id, "affiliate", "manage", !!a.permissions.affiliate?.manage)} />}
                {scope === "admins" && <PermToggle label="Manage" active={!!a.permissions.admins?.manage} onChange={() => togglePerm(a.id, "admins", "manage", !!a.permissions.admins?.manage)} />}
              </div>
            ))}
          </div>
        </div>
      ))}
      {subAdmins.length === 0 && <p className="text-text-muted text-sm">Chưa có quản trị viên cấp dưới.</p>}
    </div>
  );
}

function PermToggle({ label, active, onChange }: { label: string; active: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer transition-colors border-none ${active ? "bg-green/20 text-green" : "bg-border/30 text-text-muted"}`}
    >
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: VPS                                                                  */
/* -------------------------------------------------------------------------- */

function VpsTab() {
  const [vpsList, setVpsList] = useState<VpsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  // Form
  const [formEmail, setFormEmail] = useState("");
  const [formIp, setFormIp] = useState("");
  const [formUser, setFormUser] = useState("Administrator");
  const [formPass, setFormPass] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/vps")
      .then((r) => r.json())
      .then((d) => setVpsList(d.vps ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const assign = async () => {
    if (!formEmail || !formIp || !formPass) return;
    setMsg(null);
    const r = await fetch("/api/admin/vps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign", email: formEmail, ip: formIp, username: formUser, password: formPass, notes: formNotes }),
    });
    const d = await r.json();
    if (d.success) {
      setFormEmail(""); setFormIp(""); setFormPass(""); setFormNotes("");
      setMsg("Đã cấp VPS.");
      setTimeout(() => setMsg(null), 2000);
      load();
    } else {
      setMsg(d.error ?? "Lỗi");
    }
  };

  const updateStatus = async (vpsId: string, status: string) => {
    await fetch("/api/admin/vps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", vpsId, status }),
    });
    load();
  };

  const remove = async (vpsId: string) => {
    if (!confirm("Xác nhận xóa?")) return;
    await fetch("/api/admin/vps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", vpsId }) });
    load();
  };

  return (
    <div className="space-y-6">
      {/* Assign form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-w-[520px]">
        <h3 className="text-sm font-semibold text-text-primary">Cấp VPS cho user</h3>
        <div className="grid grid-cols-2 gap-2">
          <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email user" className="rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted" />
          <input value={formIp} onChange={(e) => setFormIp(e.target.value)} placeholder="IP VPS" className="rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted" />
          <input value={formUser} onChange={(e) => setFormUser(e.target.value)} placeholder="Username" className="rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary" />
          <input value={formPass} onChange={(e) => setFormPass(e.target.value)} placeholder="Password" type="text" className="rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted" />
        </div>
        <input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Ghi chú (tùy chọn)" className="w-full rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted" />
        <button onClick={assign} className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-4 py-2 cursor-pointer border-none hover:scale-[1.02] transition-transform">
          Cấp VPS
        </button>
      </div>
      {msg && <p className="text-[12px] text-green">{msg}</p>}

      {loading ? (
        <p className="text-text-muted text-sm">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                <th className="text-left font-medium py-3 px-3">User</th>
                <th className="text-left font-medium py-3 px-3">IP</th>
                <th className="text-left font-medium py-3 px-3">User/Pass</th>
                <th className="text-center font-medium py-3 px-3">Status</th>
                <th className="text-left font-medium py-3 px-3">Ghi chú</th>
                <th className="text-right font-medium py-3 px-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {vpsList.map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="py-2.5 px-3 text-text-primary">{v.user_email ?? "—"}</td>
                  <td className="py-2.5 px-3 font-mono text-text-secondary">{v.ip}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-text-secondary">{v.username} / {v.password}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[11px] font-medium ${v.status === "active" ? "text-green" : v.status === "suspended" ? "text-gold" : "text-red"}`}>{v.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[12px] text-text-muted max-w-[120px] truncate">{v.notes ?? "—"}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {v.status !== "suspended" && (
                        <button onClick={() => updateStatus(v.id, "suspended")} className="text-[11px] text-gold hover:underline border-none bg-transparent cursor-pointer">Tạm dừng</button>
                      )}
                      {v.status !== "active" && (
                        <button onClick={() => updateStatus(v.id, "active")} className="text-[11px] text-green hover:underline border-none bg-transparent cursor-pointer">Kích hoạt</button>
                      )}
                      <button onClick={() => remove(v.id)} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer"><Trash2 size={11} className="inline" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {vpsList.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-text-muted">Chưa có VPS nào được cấp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Affiliate (existing admin page inline)                               */
/* -------------------------------------------------------------------------- */

function AffiliateTab() {
  const [tab, setTab] = useState<"settings" | "affiliates" | "commissions">("settings");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // ponytail: reuse existing API routes, inline the minimal UI
  // Settings
  const [rate, setRate] = useState(30);
  const [cookieDays, setCookieDays] = useState(30);
  const [minPayout, setMinPayout] = useState(50);
  const [programActive, setProgramActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/affiliate/settings");
    const d = await r.json();
    if (d.settings) {
      setRate(Math.round(d.settings.commission_rate * 100));
      setCookieDays(d.settings.cookie_days);
      setMinPayout(d.settings.min_payout);
      setProgramActive(d.settings.program_active);
    }
    setLoading(false);
  };

  useEffect(() => { loadSettings(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    await fetch("/api/admin/affiliate/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commission_rate: rate / 100, cookie_days: cookieDays, min_payout: minPayout, program_active: programActive }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  // Full affiliate admin page is ~236 lines. ponytail: keep existing page at its own route
  // and link there for now. Ship simplified inline version later.
  return (
    <div className="space-y-6">
      <p className="text-text-muted text-sm">
        Quản lý affiliate tại trang riêng:{" "}
        <a href="/dashboard/admin/affiliate" className="text-gold hover:underline">/dashboard/admin/affiliate</a>
      </p>
      {/* Quick settings inline */}
      <div className="max-w-[480px] space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="text-[11px] tracking-[0.08em] uppercase text-text-muted block mb-1.5">Commission Rate (%)</label>
            <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary font-mono" />
          </div>
          <div>
            <label className="text-[11px] tracking-[0.08em] uppercase text-text-muted block mb-1.5">Cookie Days</label>
            <input type="number" value={cookieDays} onChange={(e) => setCookieDays(Number(e.target.value))} className="w-full rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary font-mono" />
          </div>
          <div>
            <label className="text-[11px] tracking-[0.08em] uppercase text-text-muted block mb-1.5">Min Payout ($)</label>
            <input type="number" value={minPayout} onChange={(e) => setMinPayout(Number(e.target.value))} className="w-full rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary font-mono" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[11px] tracking-[0.08em] uppercase text-text-muted">Program Active</label>
            <button onClick={() => setProgramActive(!programActive)} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${programActive ? "bg-green" : "bg-border"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${programActive ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </div>
        <button onClick={saveSettings} disabled={saving} className="rounded-md bg-gold-bright text-[#060609] text-sm font-semibold px-6 py-2.5 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-60">
          {saved ? "Đã lưu" : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);

  // ponytail: one fetch for both role + overview stats
  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((d) => {
        if (d.role) {
          setIsSuperAdmin(d.role === "super_admin");
          setOverviewStats({
            totalUsers: d.totalUsers ?? 0,
            unlimitedActive: d.unlimitedActive ?? 0,
            tigoldCount: d.tigoldCount ?? 0,
            stripeActiveSubs: d.stripeActiveSubs ?? 0,
            totalStripeRevenue: d.totalStripeRevenue ?? 0,
            pendingCommissions: d.pendingCommissions ?? 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Admin Backoffice</h1>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 w-fit flex-wrap">
        {TABS.map((tab) => {
          if (tab.adminOnly && !isSuperAdmin) return null;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-none ${
                activeTab === tab.id ? "bg-gold text-[#060609]" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      {activeTab === "overview" && <OverviewTab stats={overviewStats} />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "finance" && <FinanceTab />}
      {activeTab === "admins" && isSuperAdmin && <AdminsTab />}
      {activeTab === "vps" && <VpsTab />}
      {activeTab === "affiliate" && <AffiliateTab />}
    </div>
  );
}
