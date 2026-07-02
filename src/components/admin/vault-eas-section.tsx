"use client";

/**
 * Admin → Kho EA. Super-admin manages the EA Vault: add EA (+ file upload),
 * replace file, edit metadata, toggle dashboard visibility, delete.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Upload, Check, X, Boxes } from "lucide-react";
import { Loading, ErrorState, Empty } from "@/components/admin/admin-ui";

interface VaultEa {
  id: string;
  name: string;
  version: string | null;
  description: string | null;
  file_name: string | null;
  storage_path: string | null;
  public_path: string | null;
  set_storage_path: string | null;
  set_file_name: string | null;
  guide_storage_path: string | null;
  guide_file_name: string | null;
  enabled: boolean;
  requires_license: boolean;
  sort_order: number;
}

const API = "/api/admin/vault-eas";

export function VaultEasSection() {
  const [eas, setEas] = useState<VaultEa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(API)
      .then(async (r) => { if (!r.ok) throw new Error("Không tải được Kho EA."); return r.json(); })
      .then((d) => setEas(d.eas ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 2500); };

  const postJson = async (payload: Record<string, unknown>) => {
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return r.json();
  };
  const postForm = async (form: FormData) => {
    const r = await fetch(API, { method: "POST", body: form });
    return r.json();
  };

  const toggle = async (ea: VaultEa) => {
    const d = await postJson({ action: "toggle", id: ea.id });
    if (d.success) { setEas((prev) => prev.map((x) => x.id === ea.id ? { ...x, enabled: d.enabled } : x)); }
    else flash(d.error ?? "Lỗi", false);
  };

  const toggleLicense = async (ea: VaultEa) => {
    const d = await postJson({ action: "toggle_license", id: ea.id });
    if (d.success) { setEas((prev) => prev.map((x) => x.id === ea.id ? { ...x, requires_license: d.requires_license } : x)); }
    else flash(d.error ?? "Lỗi", false);
  };

  const remove = async (ea: VaultEa) => {
    if (!confirm(`Xóa EA "${ea.name}"? File sẽ bị xóa khỏi kho.`)) return;
    const d = await postJson({ action: "delete", id: ea.id });
    if (d.success) { flash("Đã xóa EA"); load(); } else flash(d.error ?? "Lỗi", false);
  };

  const replaceFile = async (id: string, file: File) => {
    setBusy(true);
    const form = new FormData();
    form.set("action", "replace_file"); form.set("id", id); form.set("file", file);
    const d = await postForm(form);
    setBusy(false);
    if (d.success) { flash("Đã cập nhật file EA"); load(); } else flash(d.error ?? "Lỗi", false);
  };

  const uploadExtra = async (id: string, type: "set" | "guide", file: File) => {
    setBusy(true);
    const form = new FormData();
    form.set("action", type === "set" ? "replace_set" : "replace_guide"); form.set("id", id); form.set("file", file);
    const d = await postForm(form);
    setBusy(false);
    if (d.success) { flash(type === "set" ? "Đã cập nhật set file" : "Đã cập nhật hướng dẫn"); load(); } else flash(d.error ?? "Lỗi", false);
  };

  const removeExtra = async (id: string, type: "set" | "guide") => {
    const d = await postJson({ action: type === "set" ? "remove_set" : "remove_guide", id });
    if (d.success) { flash("Đã gỡ file"); load(); } else flash(d.error ?? "Lỗi", false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { setShowCreate((s) => !s); setEditId(null); }} className="rounded-md bg-gold-bright text-[#060609] text-xs font-semibold px-3 py-1.5 cursor-pointer border-none hover:scale-[1.02] transition-transform">
          {showCreate ? "Đóng" : <><Plus size={14} className="inline mr-1" />Thêm EA</>}
        </button>
        {msg && <span className={`text-[12px] ${msg.ok ? "text-green" : "text-red"}`}>{msg.text}</span>}
        {busy && <span className="text-[12px] text-text-muted">Đang tải lên…</span>}
      </div>

      {showCreate && <CreateForm onDone={() => { setShowCreate(false); flash("Đã thêm EA"); load(); }} onError={(e) => flash(e, false)} setBusy={setBusy} />}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={load} />
      ) : eas.length === 0 ? (
        <Empty text="Chưa có EA nào." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                <th className="text-left font-medium py-3 px-4">Tên EA</th>
                <th className="text-left font-medium py-3 px-4">Version</th>
                <th className="text-left font-medium py-3 px-4">File</th>
                <th className="text-center font-medium py-3 px-4">Cần VIP</th>
                <th className="text-center font-medium py-3 px-4">Hiển thị</th>
                <th className="text-right font-medium py-3 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {eas.map((ea) => (
                <EaRow
                  key={ea.id}
                  ea={ea}
                  editing={editId === ea.id}
                  onEdit={() => setEditId(editId === ea.id ? null : ea.id)}
                  onSaved={() => { setEditId(null); flash("Đã lưu"); load(); }}
                  onToggle={() => toggle(ea)}
                  onToggleLicense={() => toggleLicense(ea)}
                  onDelete={() => remove(ea)}
                  onReplaceFile={(f) => replaceFile(ea.id, f)}
                  onUploadExtra={(type, f) => uploadExtra(ea.id, type, f)}
                  onRemoveExtra={(type) => removeExtra(ea.id, type)}
                  postJson={postJson}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EaRow({
  ea, editing, onEdit, onSaved, onToggle, onToggleLicense, onDelete, onReplaceFile, onUploadExtra, onRemoveExtra, postJson,
}: {
  ea: VaultEa;
  editing: boolean;
  onEdit: () => void;
  onSaved: () => void;
  onToggle: () => void;
  onToggleLicense: () => void;
  onDelete: () => void;
  onReplaceFile: (f: File) => void;
  onUploadExtra: (type: "set" | "guide", f: File) => void;
  onRemoveExtra: (type: "set" | "guide") => void;
  postJson: (p: Record<string, unknown>) => Promise<{ success?: boolean; error?: string }>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(ea.name);
  const [version, setVersion] = useState(ea.version ?? "");
  const [description, setDescription] = useState(ea.description ?? "");

  const save = async () => {
    const d = await postJson({ action: "update", id: ea.id, name, version: version || null, description: description || null });
    if (d.success) onSaved();
  };

  return (
    <>
      <tr className="border-t border-border">
        <td className="py-3 px-4 text-text-primary">{ea.name}</td>
        <td className="py-3 px-4 text-text-secondary font-mono text-[12px]">{ea.version ? `v${ea.version}` : "—"}</td>
        <td className="py-3 px-4 text-text-muted text-[12px] max-w-[220px] truncate" title={ea.file_name ?? ""}>
          {ea.file_name ?? "—"}
          {ea.storage_path ? <span className="ml-1 text-[10px] text-green">(storage)</span> : ea.public_path ? <span className="ml-1 text-[10px] text-text-muted">(public)</span> : null}
        </td>
        <td className="py-3 px-4 text-center">
          <Switch active={ea.requires_license} onChange={onToggleLicense} title={ea.requires_license ? "Cần VIP để tải — bấm để miễn phí" : "Miễn phí, ai cũng tải được — bấm để yêu cầu VIP"} />
        </td>
        <td className="py-3 px-4 text-center">
          <Switch active={ea.enabled} onChange={onToggle} />
        </td>
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end gap-3">
            <input ref={fileRef} type="file" accept=".ex5,.ex4,.mq5,.mq4,.zip" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplaceFile(f); e.currentTarget.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} className="text-[11px] text-text-secondary hover:text-gold border-none bg-transparent cursor-pointer">
              <Upload size={12} className="inline mr-0.5" />Đổi file
            </button>
            <button onClick={onEdit} className="text-[11px] text-gold hover:underline border-none bg-transparent cursor-pointer">
              <Pencil size={12} className="inline mr-0.5" />Sửa
            </button>
            <button onClick={onDelete} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">
              <Trash2 size={12} className="inline mr-0.5" />Xóa
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-border bg-deep/30">
          <td colSpan={5} className="px-4 py-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_140px] max-w-3xl">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên EA" className={inputCls} />
              <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version (vd 1.2)" className={inputCls} />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả (tùy chọn)" rows={2} className={`${inputCls} sm:col-span-2`} />
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={save} className="rounded-md bg-gold text-[#060609] text-xs font-semibold px-4 py-1.5 cursor-pointer border-none">
                <Check size={13} className="inline mr-1" />Lưu
              </button>
              <button onClick={onEdit} className="rounded-md border border-border text-text-secondary text-xs px-3 py-1.5 cursor-pointer bg-transparent">
                <X size={13} className="inline mr-1" />Hủy
              </button>
            </div>

            {/* Tệp đính kèm: set file + hướng dẫn */}
            <div className="mt-4 pt-4 border-t border-border space-y-2 max-w-3xl">
              <p className="text-[10px] uppercase tracking-[0.06em] text-text-muted">Tệp đính kèm (hiển thị nút tải trên dashboard)</p>
              <ExtraFileRow label="Set file (.set)" fileName={ea.set_file_name} accept=".set,.zip"
                onUpload={(f) => onUploadExtra("set", f)} onRemove={() => onRemoveExtra("set")} hasFile={!!ea.set_storage_path} />
              <ExtraFileRow label="Hướng dẫn cài đặt" fileName={ea.guide_file_name} accept=".html,.htm,text/html,.pdf,.zip,.docx,.txt,image/*"
                onUpload={(f) => onUploadExtra("guide", f)} onRemove={() => onRemoveExtra("guide")} hasFile={!!ea.guide_storage_path} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CreateForm({ onDone, onError, setBusy }: { onDone: () => void; onError: (e: string) => void; setBusy: (b: boolean) => void }) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [setFileVal, setSetFileVal] = useState<File | null>(null);
  const [guideFile, setGuideFile] = useState<File | null>(null);
  const [requiresLicense, setRequiresLicense] = useState(true);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim() || !file) return;
    setSaving(true); setBusy(true);
    const form = new FormData();
    form.set("action", "create"); form.set("name", name.trim());
    if (version.trim()) form.set("version", version.trim());
    if (description.trim()) form.set("description", description.trim());
    form.set("file", file);
    if (setFileVal) form.set("set", setFileVal);
    if (guideFile) form.set("guide", guideFile);
    form.set("requiresLicense", String(requiresLicense));
    const r = await fetch(API, { method: "POST", body: form });
    const d = await r.json();
    setSaving(false); setBusy(false);
    if (d.success) onDone();
    else onError(d.error ?? "Lỗi tạo EA");
  };

  return (
    <div className="rounded-xl border border-gold/40 bg-card p-4 space-y-3 max-w-2xl">
      <div className="flex items-center gap-2">
        <Boxes size={16} className="text-gold" />
        <h3 className="text-sm font-semibold text-text-primary">Thêm EA mới</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên EA *" className={inputCls} />
        <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version" className={inputCls} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả (tùy chọn)" rows={2} className={`${inputCls} sm:col-span-2`} />
      </div>
      <div className="space-y-2">
        <CreateFileRow label="File EA (.ex5) *" accept=".ex5,.ex4,.mq5,.mq4,.zip" file={file} onPick={setFile} />
        <CreateFileRow label="Set file (.set)" accept=".set,.zip" file={setFileVal} onPick={setSetFileVal} hint="tùy chọn" />
        <CreateFileRow label="Hướng dẫn cài đặt" accept=".html,.htm,text/html,.pdf,.zip,.docx,.txt,image/*" file={guideFile} onPick={setGuideFile} hint="tùy chọn" />
      </div>
      <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer w-fit">
        <input type="checkbox" checked={requiresLicense} onChange={(e) => setRequiresLicense(e.target.checked)} className="cursor-pointer" />
        Cần gói VIP mới tải được (bỏ tick = EA miễn phí, ai đăng nhập cũng tải được)
      </label>
      <button onClick={create} disabled={saving || !name.trim() || !file} className="rounded-md bg-gold-bright text-[#060609] text-sm font-semibold px-5 py-2 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100">
        {saving ? "Đang tải lên..." : "Thêm EA"}
      </button>
    </div>
  );
}

function CreateFileRow({
  label, accept, file, onPick, hint,
}: {
  label: string;
  accept: string;
  file: File | null;
  onPick: (f: File | null) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap text-[12px]">
      <span className="w-40 shrink-0 text-text-secondary">
        {label}
        {hint && <span className="ml-1 text-[10px] text-text-muted">({hint})</span>}
      </span>
      <input type="file" accept={accept} onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        className="text-[12px] text-text-secondary file:mr-3 file:rounded-md file:border-none file:bg-deep file:px-3 file:py-1.5 file:text-text-primary file:cursor-pointer" />
      {file && <span className="text-[11px] text-text-muted">{file.name} ({Math.round(file.size / 1024)} KB)</span>}
    </div>
  );
}

function ExtraFileRow({
  label, fileName, hasFile, accept, onUpload, onRemove,
}: {
  label: string;
  fileName: string | null;
  hasFile: boolean;
  accept: string;
  onUpload: (f: File) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3 flex-wrap text-[12px]">
      <span className="w-40 text-text-secondary">{label}</span>
      <span className={hasFile ? "text-text-primary font-mono truncate max-w-[200px]" : "text-text-muted"}>
        {hasFile ? (fileName ?? "đã có file") : "chưa có"}
      </span>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.currentTarget.value = ""; }} />
      <button onClick={() => ref.current?.click()} className="ml-auto text-[11px] text-gold hover:underline border-none bg-transparent cursor-pointer">
        <Upload size={11} className="inline mr-0.5" />{hasFile ? "Đổi" : "Tải lên"}
      </button>
      {hasFile && (
        <button onClick={onRemove} className="text-[11px] text-red hover:underline border-none bg-transparent cursor-pointer">
          <X size={11} className="inline" /> Gỡ
        </button>
      )}
    </div>
  );
}

function Switch({ active, onChange, title }: { active: boolean; onChange: () => void; title?: string }) {
  return (
    <button type="button" role="switch" aria-checked={active} onClick={onChange} title={title}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${active ? "bg-green" : "bg-border"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${active ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

const inputCls = "rounded-md border border-border bg-deep px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted";
