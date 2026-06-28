"use client";

import { useEffect, useState } from "react";

export function AdminNotifications({ canPost }: { canPost: boolean }) {
  const [notes, setNotes] = useState<{ id: string; message: string; created_at: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [posting, setPosting] = useState(false);

  const load = () => fetch("/api/admin/notifications").then((r) => r.json()).then((d) => setNotes(d.notifications ?? [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!msg.trim()) return;
    setPosting(true);
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg.trim() }) });
    setMsg("");
    setPosting(false);
    load();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 mt-4">
      <h3 className="text-sm font-semibold text-text-primary">Thông báo nội bộ</h3>
      {canPost && (
        <div className="flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && post()} placeholder="Viết thông báo..." className="flex-1 rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted" />
          <button onClick={post} disabled={posting} className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform">Gửi</button>
        </div>
      )}
      {notes.length === 0 ? (
        <p className="text-text-muted text-sm">Chưa có thông báo.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map((n) => (<div key={n.id} className="text-sm text-text-primary border-l-2 border-gold pl-3"><p>{n.message}</p><p className="text-[10px] text-text-muted mt-0.5">{new Date(n.created_at).toLocaleString()}</p></div>))}
        </div>
      )}
    </div>
  );
}
