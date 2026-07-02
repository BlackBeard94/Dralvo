/** POST /api/admin/blog/upload — admin uploads a blog image, returns its URL. */
import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, can } from "@/lib/admin/auth";
import { readImageFromRequest, uploadBlogImage } from "@/lib/blog/upload";

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "marketing.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const img = await readImageFromRequest(request);
  if ("error" in img) return NextResponse.json({ error: img.error }, { status: 400 });

  const result = await uploadBlogImage(img.bytes, img.contentType);
  if (!result.ok) {
    const code = result.error === "too_large" || result.error === "unsupported_type" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status: code });
  }
  return NextResponse.json({ success: true, url: result.url });
}
