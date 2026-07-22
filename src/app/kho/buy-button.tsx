"use client";

import { useCallback, useState } from "react";
import { Loader2, ShoppingCart, X } from "lucide-react";

/**
 * Guest checkout: collect an e-mail (that's where the download link goes),
 * open a Cryptomus invoice and hand the buyer over to it.
 */
export function BuyButton({ eaId, eaName, price }: { eaId: string; eaName: string; price: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Email chưa hợp lệ — link tải sẽ gửi vào email này.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eaId, email: email.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.url) {
        window.location.href = body.url;
        return;
      }
      setError(
        body?.error === "payment_unavailable"
          ? "Cổng thanh toán chưa sẵn sàng. Nhắn @dralvoea giúp mình nhé."
          : "Không tạo được đơn. Thử lại hoặc nhắn @dralvoea.",
      );
    } catch {
      setError("Lỗi kết nối. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }, [eaId, email]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold bg-gold-bright text-[#060609] transition-transform hover:scale-[1.02]"
      >
        <ShoppingCart className="h-4 w-4" />
        Mua ${price}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gold/30 bg-deep/70 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-text-primary">Mua {eaName} — ${price}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="text-text-muted hover:text-text-primary">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
        placeholder="email nhận link tải"
        className="w-full rounded-md bg-card border border-border px-2.5 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-gold/50"
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={loading}
        className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-bold bg-gold-bright text-[#060609] disabled:opacity-60 transition-transform hover:scale-[1.02]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Đang tạo đơn…" : "Thanh toán bằng crypto"}
      </button>
      {error && <p className="mt-1.5 text-[11px] text-red leading-relaxed">{error}</p>}
      <p className="mt-1.5 text-[10px] text-text-muted leading-relaxed">
        Link tải gửi vào email sau khi thanh toán được xác nhận. Mua 1 lần, dùng vĩnh viễn.
      </p>
    </div>
  );
}
