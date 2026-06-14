export function isAdminEmail(email: string | null | undefined) {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails || !email) return false;

  return adminEmails
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
