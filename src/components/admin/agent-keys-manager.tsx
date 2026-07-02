"use client";

/**
 * Backoffice — Agent API keys. Create per-key scoped tokens for external agents
 * (blog + ops), toggle scopes/active, revoke. The secret is shown exactly once.
 */
import { useCallback, useEffect, useState } from "react";
import { Copy, Check, Trash2, Plus, KeyRound, ShieldAlert } from "lucide-react";

import { AGENT_SCOPES, type AgentScope } from "@/lib/agent/scopes";
import { Loading, ErrorState, Empty } from "@/components/admin/admin-ui";

type KeyRecord = {
  id: string;
  label: string;
  key_prefix: string;
  scopes: string[];
  active: boolean;
  last_used_at: string | null;
  created_at: string;
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("vi-VN") : "—");

function ScopeChecklist({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (s: AgentScope) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {AGENT_SCOPES.map((s) => (
        <label
          key={s.key}
          className="flex items-start gap-2 rounded-md border border-border bg-surface/50 p-2.5 cursor-pointer hover:border-gold/40 transition-colors"
        >
          <input
            type="checkbox"
            checked={selected.has(s.key)}
            onChange={() => onToggle(s.key)}
            className="mt-0.5 accent-[var(--gold-bright,#F0C85A)]"
          />
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-text-primary">{s.label}</span>
            <span className="block text-[11px] leading-snug text-text-muted">{s.desc}</span>
            <code className="text-[10px] text-gold">{s.key}</code>
          </span>
        </label>
      ))}
    </div>
  );
}

export function AgentKeysManager() {
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [newScopes, setNewScopes] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editScopes, setEditScopes] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tải được danh sách key");
      setKeys(data.keys ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!label.trim() || newScopes.size === 0) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), scopes: [...newScopes] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo key thất bại");
      setRevealed(data.key);
      setCopied(false);
      setLabel("");
      setNewScopes(new Set());
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/agent-keys", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (res.ok) await load();
    else setError((await res.json().catch(() => ({}))).error || "Cập nhật thất bại");
  };

  const remove = async (id: string, lbl: string) => {
    if (!window.confirm(`Thu hồi vĩnh viễn key "${lbl}"? Agent dùng key này sẽ mất quyền ngay.`)) return;
    const res = await fetch("/api/admin/agent-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await load();
    else setError((await res.json().catch(() => ({}))).error || "Thu hồi thất bại");
  };

  const copyKey = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
      setCopied(true);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  const toggleNew = (s: AgentScope) =>
    setNewScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  const toggleEdit = (s: AgentScope) =>
    setEditScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <KeyRound size={18} className="text-gold" /> API Keys cho Agent
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Tạo key riêng cho từng agent, tích chọn đúng quyền cần thiết. Secret chỉ hiện <strong>một lần</strong> khi tạo.
          Gửi kèm header <code className="text-gold">Authorization: Bearer &lt;key&gt;</code>.
        </p>
      </header>

      {/* One-time reveal */}
      {revealed && (
        <div className="rounded-lg border border-gold/50 bg-gold/[0.06] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gold">
            <ShieldAlert size={16} /> Sao chép ngay — key này sẽ không hiển thị lại
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-deep px-3 py-2 font-mono text-[13px] text-text-primary">
              {revealed}
            </code>
            <button
              onClick={copyKey}
              className="inline-flex items-center gap-1.5 rounded-md bg-gold-bright px-3 py-2 text-[13px] font-semibold text-[#060609] cursor-pointer border-none hover:opacity-90"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Đã chép" : "Chép"}
            </button>
          </div>
          <button onClick={() => setRevealed(null)} className="mt-3 text-[12px] text-text-muted hover:text-text-primary border-none bg-transparent cursor-pointer">
            Tôi đã lưu key — đóng
          </button>
        </div>
      )}

      {/* Create */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-text-primary">Tạo key mới</h3>
        <div className="mt-3 space-y-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Tên agent (vd: Paperclip - Blog & Ops)"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-gold/50"
          />
          <ScopeChecklist selected={newScopes} onToggle={toggleNew} />
          <button
            onClick={create}
            disabled={creating || !label.trim() || newScopes.size === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-gold-bright px-4 py-2 text-sm font-semibold text-[#060609] cursor-pointer border-none hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={15} /> {creating ? "Đang tạo..." : "Tạo key"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={load} />
      ) : keys.length === 0 ? (
        <Empty text="Chưa có key nào." />
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{k.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${k.active ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
                      {k.active ? "Hoạt động" : "Đã tắt"}
                    </span>
                  </div>
                  <code className="mt-1 block font-mono text-[12px] text-text-muted">{k.key_prefix}…</code>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {k.scopes.map((s) => (
                      <span key={s} className="rounded-full border border-border bg-surface/60 px-2 py-0.5 text-[10px] text-gold">
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-text-muted">
                    Dùng lần cuối: {fmt(k.last_used_at)} · Tạo: {fmt(k.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => patch(k.id, { active: !k.active })}
                    className="rounded-md border border-border px-3 py-1.5 text-[12px] text-text-secondary hover:text-text-primary hover:border-gold/40 cursor-pointer bg-transparent"
                  >
                    {k.active ? "Tắt" : "Bật"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(editing === k.id ? null : k.id);
                      setEditScopes(new Set(k.scopes));
                    }}
                    className="rounded-md border border-border px-3 py-1.5 text-[12px] text-text-secondary hover:text-text-primary hover:border-gold/40 cursor-pointer bg-transparent"
                  >
                    Sửa quyền
                  </button>
                  <button
                    onClick={() => remove(k.id, k.label)}
                    className="inline-flex items-center gap-1 rounded-md border border-red/40 px-3 py-1.5 text-[12px] text-red hover:bg-red/10 cursor-pointer bg-transparent"
                  >
                    <Trash2 size={13} /> Thu hồi
                  </button>
                </div>
              </div>

              {editing === k.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <ScopeChecklist selected={editScopes} onToggle={toggleEdit} />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={async () => {
                        if (editScopes.size === 0) return;
                        await patch(k.id, { scopes: [...editScopes] });
                        setEditing(null);
                      }}
                      disabled={editScopes.size === 0}
                      className="rounded-md bg-gold-bright px-3 py-1.5 text-[12px] font-semibold text-[#060609] cursor-pointer border-none hover:opacity-90 disabled:opacity-40"
                    >
                      Lưu quyền
                    </button>
                    <button onClick={() => setEditing(null)} className="rounded-md border border-border px-3 py-1.5 text-[12px] text-text-muted hover:text-text-primary cursor-pointer bg-transparent">
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
