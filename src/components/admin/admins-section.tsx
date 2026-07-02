"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2, ShieldCheck, Search } from "lucide-react";
import { Loading, ErrorState, Empty } from "@/components/admin/admin-ui";

interface SubAdminRow {
  id: string;
  email: string | null;
  role: string;
  permissions: Record<string, Record<string, boolean>>;
  created_at: string;
}

export function AdminsSection() {
  const [subAdmins, setSubAdmins] = useState<SubAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/sub-admins")
      .then(async (r) => {
        if (!r.ok) throw new Error("Không tải được danh sách quản trị viên.");
        return r.json();
      })
      .then((d) => setSubAdmins(d.subAdmins ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (!confirm("Xác nhận xóa quản trị viên này?")) return;
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subAdmins.filter((a) => {
      const matchesRole = roleFilter === "all" || a.role === roleFilter;
      const matchesQuery = q === "" || (a.email ?? "").toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [subAdmins, query, roleFilter]);

  const ROLE_FILTERS: { value: string; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "super_admin", label: "super_admin" },
    { value: "admin", label: "admin" },
    { value: "support", label: "support" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-w-[520px]">
        <h3 className="text-sm font-semibold text-text-primary">Thêm quản trị viên</h3>
        <div className="flex flex-wrap gap-2">
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email user..." className="min-w-[160px] flex-1 rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted" />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="rounded-md border border-border bg-deep px-2 py-1.5 text-sm text-text-primary">
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
          </select>
          <button onClick={create} className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform">Thêm</button>
        </div>
        {msg && <p className="text-[12px] text-green">{msg}</p>}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={load} />
      ) : subAdmins.length === 0 ? (
        <Empty text="Chưa có quản trị viên cấp dưới." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo email..."
                className="w-full rounded-md border border-border bg-deep pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ROLE_FILTERS.map((rf) => {
                const isActive = roleFilter === rf.value;
                return (
                  <button
                    key={rf.value}
                    onClick={() => setRoleFilter(rf.value)}
                    className={`rounded-md border px-2.5 py-1 text-xs cursor-pointer transition-colors ${isActive ? "border-gold bg-gold/15 text-gold" : "border-border bg-deep text-text-secondary hover:text-text-primary"}`}
                  >
                    {rf.label}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-text-muted">{filtered.length} quản trị viên</span>
          </div>

          {filtered.length === 0 ? (
            <Empty text="Không tìm thấy quản trị viên phù hợp." />
          ) : (
            filtered.map((a) => {
          const isSuper = a.role === "super_admin";
          return (
            <div key={a.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header band */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-deep/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm font-medium text-text-primary truncate">{a.email ?? "—"}</span>
                  <span className={`shrink-0 text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full ${isSuper ? "bg-gold/20 text-gold" : a.role === "admin" ? "bg-green/20 text-green" : "bg-border text-text-muted"}`}>
                    {a.role}
                  </span>
                </div>
                <button onClick={() => remove(a.id)} className="flex items-center gap-1 text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer shrink-0">
                  <Trash2 size={13} />Xóa
                </button>
              </div>

              {/* Permissions */}
              {isSuper ? (
                <div className="flex items-center gap-2 px-4 py-3.5 text-[13px] text-gold">
                  <ShieldCheck size={15} className="shrink-0" />
                  Toàn quyền hệ thống — không cần phân quyền chi tiết.
                </div>
              ) : (
                <div className="px-4">
                  {PERMS.map(({ scope, perm, label }, i) => {
                    const active = !!a.permissions[scope]?.[perm];
                    return (
                      <div
                        key={`${scope}.${perm}`}
                        className={`flex items-center justify-between gap-3 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                      >
                        <span className="text-[13px] text-text-secondary">{label}</span>
                        <Switch active={active} onChange={() => togglePerm(a.id, scope, perm, active)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
            })
          )}
        </>
      )}
    </div>
  );
}

/** Flat list of permissions with friendly labels, rendered as on/off switches. */
const PERMS: { scope: string; perm: string; label: string }[] = [
  { scope: "users", perm: "view", label: "Người dùng · Xem" },
  { scope: "users", perm: "edit", label: "Người dùng · Sửa" },
  { scope: "license", perm: "manage", label: "License · Quản lý" },
  { scope: "finance", perm: "view", label: "Tài chính · Xem" },
  { scope: "marketing", perm: "view", label: "Marketing · Xem" },
  { scope: "affiliate", perm: "manage", label: "Affiliate · Quản lý" },
];

function Switch({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none shrink-0 ${active ? "bg-green" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${active ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
