"use client";

import { useEffect, useState } from "react";

export default function AdminNotificationsPage() {
  const [notes, setNotes] = useState<{ id: string; message: string; created_at: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [posting, setPosting] = useState(false);
  const [role, setRole] = useState("");

  const load = () => fetch("/api/admin/notifications").then((r) => r.json()).then((d) => setNotes(d.notifications ?? [])).catch(() => {});
  useEffect(() => { load(); fetch("/api/admin/overview").then((r) => r.json()).then((d) => setRole(d.role ?? "")).catch(() => {}); }, []);

  const post = async () => {
    if (!msg.trim()) return;
    setPosting(true);
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg.trim() }) });
    setMsg("");
    setPosting(false);
    load();
  };

  const canPost = role === "super_admin";

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold text-text-primary">Thông báo nội bộ</h1>

      {canPost && (
        <div className="flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && post()} placeholder="Viết thông báo..." className="flex-1 rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted" />
          <button onClick={post} disabled={posting} className="rounded-md bg-gold text-[#060609] text-sm font-semibold px-4 py-2 cursor-pointer border-none hover:scale-[1.02] transition-transform">Gửi</button>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-text-muted text-sm">Chưa có thông báo.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-text-primary">{n.message}</p>
              <p className="text-[10px] text-text-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
