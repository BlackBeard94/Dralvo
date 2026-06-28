import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/dashboard");

  return <>{children}</>;
}
