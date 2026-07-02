/**
 * Agent API scopes — the granular permissions an agent key can hold. Each admin
 * key can be granted any subset via checkboxes in the backoffice.
 *
 * Keep this list in sync with the endpoints that enforce each scope.
 */
export const AGENT_SCOPES = [
  { key: "blog:write", label: "Blog — viết & đăng", desc: "Tạo/sửa/đăng bài blog và upload ảnh (/api/agent/blog)." },
  { key: "ops:overview", label: "Ops — tổng quan", desc: "Đọc số liệu tổng: user, sub active/EA, doanh thu, tăng trưởng." },
  { key: "ops:customers", label: "Ops — khách & thanh toán", desc: "Feed khách mới đăng ký + thanh toán mới (email, gói, ngày)." },
  { key: "ops:marketing", label: "Ops — marketing", desc: "Số liệu marketing: nguồn traffic, chiến dịch, conversion." },
  { key: "ops:grant_key", label: "Ops — cấp key free", desc: "Cấp license cho user theo email. Quyền GHI nhạy cảm." },
] as const;

export type AgentScope = (typeof AGENT_SCOPES)[number]["key"];

export const AGENT_SCOPE_KEYS: AgentScope[] = AGENT_SCOPES.map((s) => s.key);

export function isAgentScope(v: unknown): v is AgentScope {
  return typeof v === "string" && (AGENT_SCOPE_KEYS as string[]).includes(v);
}
