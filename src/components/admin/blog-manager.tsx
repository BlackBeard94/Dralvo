"use client";

/**
 * Admin → Blog. Create/edit multilingual posts (one row per slug+locale).
 * Same slug + different locale = a translation of the same article.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink, X, Languages } from "lucide-react";

import { SUPPORTED_LOCALES, LOCALE_LABELS, type SupportedLocale } from "@/lib/i18n";
import type { BlogPost, BlogFaq, BlogStatus } from "@/lib/blog/types";

type Form = {
  id?: string;
  slug: string;
  locale: SupportedLocale;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string;
  tags: string;
  author: string;
  meta_title: string;
  meta_description: string;
  faq: BlogFaq[];
  status: BlogStatus;
};

const emptyForm: Form = {
  slug: "", locale: "vi", title: "", excerpt: "", body: "", cover_image_url: "",
  tags: "", author: "Dralvo", meta_title: "", meta_description: "", faq: [], status: "draft",
};

function postToForm(p: BlogPost): Form {
  return {
    id: p.id, slug: p.slug, locale: p.locale, title: p.title, excerpt: p.excerpt ?? "",
    body: p.body, cover_image_url: p.cover_image_url ?? "", tags: p.tags.join(", "),
    author: p.author, meta_title: p.meta_title ?? "", meta_description: p.meta_description ?? "",
    faq: p.faq, status: p.status,
  };
}

const input = "w-full rounded-md border border-border bg-deep px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-gold/50";
const label = "text-[11px] uppercase tracking-[0.08em] text-text-muted";

export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 2600); };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/blog/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok && d.url) return d.url as string;
      flash(`Upload lỗi: ${d.error ?? r.status}`, false);
      return null;
    } catch {
      flash("Upload thất bại", false);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/blog");
      if (!r.ok) throw new Error();
      const d = await r.json();
      setPosts(d.posts ?? []);
    } catch { flash("Không tải được danh sách", false); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by slug so translations sit together.
  const groups = useMemo(() => {
    const m = new Map<string, BlogPost[]>();
    for (const p of posts) (m.get(p.slug) ?? m.set(p.slug, []).get(p.slug)!).push(p);
    return [...m.entries()];
  }, [posts]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/blog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          tags: editing.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const d = await r.json();
      if (r.ok && d.success) { flash("Đã lưu"); setEditing(null); load(); }
      else flash(`Lỗi: ${d.error ?? r.status}`, false);
    } catch { flash("Lưu thất bại", false); }
    setSaving(false);
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Xóa bài "${title}"? Không thể hoàn tác.`)) return;
    const r = await fetch("/api/admin/blog", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (r.ok) { flash("Đã xóa"); load(); } else flash("Xóa thất bại", false);
  };

  const newTranslation = (slug: string, base: BlogPost) => {
    const taken = new Set(posts.filter((p) => p.slug === slug).map((p) => p.locale));
    const next = SUPPORTED_LOCALES.find((l) => !taken.has(l)) ?? "en";
    setEditing({ ...postToForm(base), id: undefined, locale: next, title: "", body: "", excerpt: "", status: "draft" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Blog</h1>
          <p className="text-[13px] text-text-muted mt-0.5">Bài viết đa ngôn ngữ cho SEO/GEO. Cùng slug + khác ngôn ngữ = bản dịch.</p>
        </div>
        <button onClick={() => setEditing({ ...emptyForm })} className="inline-flex items-center gap-2 rounded-md bg-gold-bright px-4 py-2 text-sm font-semibold text-[#060609] cursor-pointer border-none hover:scale-[1.02] transition-transform">
          <Plus size={16} /> Bài mới
        </button>
      </div>

      {msg && <p className={`text-[13px] ${msg.ok ? "text-green" : "text-red"}`}>{msg.text}</p>}

      {loading ? (
        <p className="text-text-muted text-sm">Đang tải...</p>
      ) : groups.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-text-muted text-sm">Chưa có bài viết nào.</p>
      ) : (
        <div className="space-y-3">
          {groups.map(([slug, rows]) => (
            <div key={slug} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <code className="font-mono text-[12px] text-text-muted">/blog/{slug}</code>
                <button onClick={() => newTranslation(slug, rows[0])} className="inline-flex items-center gap-1 text-[12px] text-gold hover:underline border-none bg-transparent cursor-pointer">
                  <Languages size={13} /> Thêm ngôn ngữ
                </button>
              </div>
              <div className="mt-3 divide-y divide-border/60">
                {rows.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-border bg-deep px-1.5 py-0.5 text-[10px] font-mono text-text-secondary">{LOCALE_LABELS[p.locale]}</span>
                        <span className="truncate text-sm text-text-primary">{p.title}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`text-[11px] font-medium ${p.status === "published" ? "text-green" : "text-gold"}`}>{p.status === "published" ? "Đã đăng" : "Nháp"}</span>
                      <a href={`/blog/${p.slug}?hl=${p.locale}`} target="_blank" rel="noreferrer" className="text-text-muted hover:text-gold" title="Xem"><ExternalLink size={15} /></a>
                      <button onClick={() => setEditing(postToForm(p))} className="text-gold hover:text-gold-bright border-none bg-transparent cursor-pointer" title="Sửa"><Pencil size={15} /></button>
                      <button onClick={() => remove(p.id, p.title)} className="text-text-muted hover:text-red border-none bg-transparent cursor-pointer" title="Xóa"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">{editing.id ? "Sửa bài" : "Bài mới"}</h2>
              <button onClick={() => setEditing(null)} className="text-text-muted hover:text-text-primary border-none bg-transparent cursor-pointer"><X size={18} /></button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={label}>Slug (URL)</label><input className={`${input} mt-1 font-mono`} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="goldmaster-vs-martingale" /></div>
                <div><label className={label}>Ngôn ngữ</label>
                  <select className={`${input} mt-1`} value={editing.locale} onChange={(e) => setEditing({ ...editing, locale: e.target.value as SupportedLocale })}>
                    {SUPPORTED_LOCALES.map((l) => <option key={l} value={l}>{LOCALE_LABELS[l]}</option>)}
                  </select>
                </div>
              </div>

              <div><label className={label}>Tiêu đề</label><input className={`${input} mt-1`} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><label className={label}>Tóm tắt / TL;DR (excerpt — quan trọng cho GEO)</label><textarea className={`${input} mt-1 min-h-[64px]`} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={label}>Nội dung (Markdown)</label>
                  <label className="cursor-pointer text-[12px] text-gold hover:underline">
                    {uploading ? "Đang tải..." : "+ Chèn ảnh"}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f); if (url) setEditing((p) => (p ? { ...p, body: `${p.body}\n\n![](${url})\n` } : p)); } e.target.value = ""; }} />
                  </label>
                </div>
                <textarea className={`${input} mt-1 min-h-[260px] font-mono text-[13px]`} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder={"## Tiêu đề mục\n\nĐoạn văn... **in đậm**, [link](https://...).\n\n- gạch đầu dòng"} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Ảnh bìa</label>
                  <div className="mt-1 flex gap-2">
                    <input className={`${input} flex-1`} value={editing.cover_image_url} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} placeholder="https://... hoặc tải lên →" />
                    <label className="shrink-0 cursor-pointer rounded-md border border-border bg-deep px-3 py-2 text-xs text-text-secondary hover:text-text-primary whitespace-nowrap">
                      {uploading ? "..." : "Tải lên"}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await uploadImage(f); if (url) setEditing((p) => (p ? { ...p, cover_image_url: url } : p)); } e.target.value = ""; }} />
                    </label>
                  </div>
                  {editing.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editing.cover_image_url} alt="" className="mt-2 h-24 w-full rounded-md border border-border object-cover" />
                  )}
                </div>
                <div><label className={label}>Tags (phân tách bằng dấu phẩy)</label><input className={`${input} mt-1`} value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} placeholder="XAUUSD, EA, MT5" /></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={label}>Meta title (SEO — bỏ trống = dùng tiêu đề)</label><input className={`${input} mt-1`} value={editing.meta_title} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} /></div>
                <div><label className={label}>Tác giả</label><input className={`${input} mt-1`} value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></div>
              </div>
              <div><label className={label}>Meta description (SEO — 150-160 ký tự)</label><textarea className={`${input} mt-1 min-h-[56px]`} value={editing.meta_description} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} /></div>

              {/* FAQ → FAQPage schema (GEO gold) */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className={label}>FAQ (tạo FAQ schema — LLM/Google rất thích)</label>
                  <button onClick={() => setEditing({ ...editing, faq: [...editing.faq, { q: "", a: "" }] })} className="text-[12px] text-gold hover:underline border-none bg-transparent cursor-pointer">+ Thêm câu hỏi</button>
                </div>
                <div className="space-y-2">
                  {editing.faq.map((f, i) => (
                    <div key={i} className="rounded-lg border border-border bg-deep/40 p-2.5">
                      <div className="flex items-center gap-2">
                        <input className={`${input} flex-1`} value={f.q} placeholder="Câu hỏi" onChange={(e) => { const faq = [...editing.faq]; faq[i] = { ...faq[i], q: e.target.value }; setEditing({ ...editing, faq }); }} />
                        <button onClick={() => setEditing({ ...editing, faq: editing.faq.filter((_, j) => j !== i) })} className="text-text-muted hover:text-red border-none bg-transparent cursor-pointer"><X size={15} /></button>
                      </div>
                      <textarea className={`${input} mt-1.5 min-h-[48px]`} value={f.a} placeholder="Câu trả lời" onChange={(e) => { const faq = [...editing.faq]; faq[i] = { ...faq[i], a: e.target.value }; setEditing({ ...editing, faq }); }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input type="checkbox" className="accent-gold" checked={editing.status === "published"} onChange={(e) => setEditing({ ...editing, status: e.target.checked ? "published" : "draft" })} />
                  Đăng (published)
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(null)} className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary bg-transparent cursor-pointer hover:text-text-primary">Hủy</button>
                  <button onClick={save} disabled={saving} className="rounded-md bg-gold-bright px-5 py-2 text-sm font-semibold text-[#060609] cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-60">{saving ? "Đang lưu..." : "Lưu"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
