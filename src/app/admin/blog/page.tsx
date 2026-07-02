import { redirect } from "next/navigation";

import { getAdmin, can } from "@/lib/admin/auth";
import { BlogManager } from "@/components/admin/blog-manager";

export default async function AdminBlogPage() {
  const admin = await getAdmin();
  if (!admin || !can(admin, "marketing.view")) redirect("/admin");
  return <BlogManager />;
}
