/**
 * GET/POST /api/admin/vault-eas
 * Super-admin only. Manage the EA Vault ("Kho EA"): list, add (with file
 * upload), replace file, edit metadata, toggle dashboard visibility, delete.
 * Files are stored in the private Supabase Storage bucket 'ea-files'.
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin/auth";

const BUCKET = "ea-files";

async function requireSuperAdmin() {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") return null;
  return admin;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "ea.ex5";
}

// The browser-reported File.type is sometimes wrong/blank for guide uploads,
// which made HTML guides download as an unreadable file instead of opening as
// a webpage. Trust the extension for the one content-sensitive slot (guide).
function resolveContentType(fileName: string, reported: string): string {
  if (/\.html?$/i.test(fileName)) return "text/html; charset=utf-8";
  return reported || "application/octet-stream";
}

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Chỉ super admin." }, { status: 403 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const { data, error } = await client
    .from("vault_eas")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ eas: data ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Chỉ super admin." }, { status: 403 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const contentType = request.headers.get("content-type") ?? "";

  try {
    /* ---- multipart: create / replace_file (carries the uploaded file) ---- */
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const action = String(form.get("action") ?? "");
      const file = form.get("file") as File | null;
      if (!file || typeof file.arrayBuffer !== "function") {
        return NextResponse.json({ error: "Thiếu file EA" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const path = `eas/${randomUUID()}-${safeName(file.name)}`;
      const uploadContentType = action === "replace_guide" ? resolveContentType(file.name, file.type) : file.type || "application/octet-stream";
      const { error: upErr } = await client.storage
        .from(BUCKET)
        .upload(path, buf, { contentType: uploadContentType, upsert: false });
      if (upErr) return NextResponse.json({ error: `Upload thất bại: ${upErr.message}` }, { status: 500 });

      if (action === "create") {
        const name = String(form.get("name") ?? "").trim();
        if (!name) {
          await client.storage.from(BUCKET).remove([path]);
          return NextResponse.json({ error: "Thiếu tên EA" }, { status: 400 });
        }
        const version = String(form.get("version") ?? "").trim() || null;
        const description = String(form.get("description") ?? "").trim() || null;
        const requiresLicense = String(form.get("requiresLicense") ?? "true") !== "false";

        // Optional attachments uploaded together with the EA: set file + guide.
        const uploaded = [path];
        const extra: Record<string, string> = {};
        const attach = async (field: "set" | "guide", pathCol: string, nameCol: string) => {
          const f = form.get(field) as File | null;
          if (!f || typeof f.arrayBuffer !== "function") return;
          const p = `eas/${randomUUID()}-${safeName(f.name)}`;
          const { error: e } = await client.storage
            .from(BUCKET)
            .upload(p, Buffer.from(await f.arrayBuffer()), { contentType: resolveContentType(f.name, f.type), upsert: false });
          if (!e) { extra[pathCol] = p; extra[nameCol] = f.name; uploaded.push(p); }
        };
        await attach("set", "set_storage_path", "set_file_name");
        await attach("guide", "guide_storage_path", "guide_file_name");

        const { data: maxRow } = await client.from("vault_eas").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
        const sort_order = (maxRow?.sort_order ?? 0) + 1;
        const { error } = await client.from("vault_eas").insert({
          name, version, description, file_name: file.name, storage_path: path,
          ...extra, enabled: true, sort_order, requires_license: requiresLicense, created_by: admin.user_id,
        });
        if (error) {
          await client.storage.from(BUCKET).remove(uploaded);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      if (action === "replace_file") {
        const id = String(form.get("id") ?? "");
        if (!id) { await client.storage.from(BUCKET).remove([path]); return NextResponse.json({ error: "Thiếu id" }, { status: 400 }); }
        const { data: old } = await client.from("vault_eas").select("storage_path").eq("id", id).maybeSingle();
        const { error } = await client.from("vault_eas")
          .update({ storage_path: path, public_path: null, file_name: file.name, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) { await client.storage.from(BUCKET).remove([path]); return NextResponse.json({ error: error.message }, { status: 500 }); }
        if (old?.storage_path) await client.storage.from(BUCKET).remove([old.storage_path]).catch(() => {});
        return NextResponse.json({ success: true });
      }

      if (action === "replace_set" || action === "replace_guide") {
        const id = String(form.get("id") ?? "");
        if (!id) { await client.storage.from(BUCKET).remove([path]); return NextResponse.json({ error: "Thiếu id" }, { status: 400 }); }
        const col = action === "replace_set" ? "set_storage_path" : "guide_storage_path";
        const nameCol = action === "replace_set" ? "set_file_name" : "guide_file_name";
        const { data: old } = await client.from("vault_eas").select(col).eq("id", id).maybeSingle();
        const { error } = await client.from("vault_eas")
          .update({ [col]: path, [nameCol]: file.name, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) { await client.storage.from(BUCKET).remove([path]); return NextResponse.json({ error: error.message }, { status: 500 }); }
        const oldPath = (old as Record<string, string | null> | null)?.[col];
        if (oldPath) await client.storage.from(BUCKET).remove([oldPath]).catch(() => {});
        return NextResponse.json({ success: true });
      }

      await client.storage.from(BUCKET).remove([path]);
      return NextResponse.json({ error: "Unknown multipart action" }, { status: 400 });
    }

    /* ---- json: toggle / update / delete ---- */
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "toggle") {
      const { id } = body as { id: string };
      const { data: cur } = await client.from("vault_eas").select("enabled").eq("id", id).maybeSingle();
      if (!cur) return NextResponse.json({ error: "Không tìm thấy EA" }, { status: 404 });
      await client.from("vault_eas").update({ enabled: !cur.enabled, updated_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ success: true, enabled: !cur.enabled });
    }

    if (action === "toggle_license") {
      const { id } = body as { id: string };
      const { data: cur } = await client.from("vault_eas").select("requires_license").eq("id", id).maybeSingle();
      if (!cur) return NextResponse.json({ error: "Không tìm thấy EA" }, { status: 404 });
      await client.from("vault_eas").update({ requires_license: !cur.requires_license, updated_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ success: true, requires_license: !cur.requires_license });
    }

    if (action === "update") {
      const { id, name, version, description, sortOrder } = body as {
        id: string; name?: string; version?: string | null; description?: string | null; sortOrder?: number;
      };
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof name === "string") { if (!name.trim()) return NextResponse.json({ error: "Tên không được trống" }, { status: 400 }); updates.name = name.trim(); }
      if (version !== undefined) updates.version = version ? String(version).trim() : null;
      if (description !== undefined) updates.description = description ? String(description).trim() : null;
      if (typeof sortOrder === "number") updates.sort_order = sortOrder;
      await client.from("vault_eas").update(updates).eq("id", id);
      return NextResponse.json({ success: true });
    }

    if (action === "remove_set" || action === "remove_guide") {
      const { id } = body as { id: string };
      const col = action === "remove_set" ? "set_storage_path" : "guide_storage_path";
      const nameCol = action === "remove_set" ? "set_file_name" : "guide_file_name";
      const { data: row } = await client.from("vault_eas").select(col).eq("id", id).maybeSingle();
      await client.from("vault_eas").update({ [col]: null, [nameCol]: null, updated_at: new Date().toISOString() }).eq("id", id);
      const oldPath = (row as Record<string, string | null> | null)?.[col];
      if (oldPath) await client.storage.from(BUCKET).remove([oldPath]).catch(() => {});
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      const { id } = body as { id: string };
      const { data: row } = await client.from("vault_eas").select("storage_path").eq("id", id).maybeSingle();
      await client.from("vault_eas").delete().eq("id", id);
      if (row?.storage_path) await client.storage.from(BUCKET).remove([row.storage_path]).catch(() => {});
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[Admin Vault EAs]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
