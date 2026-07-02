# Dralvo Docs — Bản đồ tài liệu

> Dralvo đã pivot từ **V1 (SaaS dashboard phân tích)** sang **V2 (hệ sinh thái
> trader vàng: Indicator → Bot EA → Khóa học → IB → Copy trade)**.
> Tài liệu dưới đây chia theo vai trò để tránh nhầm lẫn nguồn sự thật.

## 🎯 Nguồn sự thật sản phẩm (V2 — đang chạy)

| Tài liệu | Vai trò |
|----------|---------|
| [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md) | **Canonical.** Kế hoạch sản phẩm V2 + trạng thái triển khai. Mọi doc khác phụ thuộc doc này. |
| [`V2_MIGRATION_MAP.md`](./V2_MIGRATION_MAP.md) | Bản đồ giữ/sửa/xóa/mới từng module để pivot codebase V1 → V2. |
| [`DRALVO_STRATEGY_SYSTEM.md`](./DRALVO_STRATEGY_SYSTEM.md) | Hệ chiến lược 5 tier (H1 → multi-TF). |
| [`DRALVO_STRATEGY_COMPLETE.md`](./DRALVO_STRATEGY_COMPLETE.md) | Chiến lược lõi Tier 3A (CFTC + Trend + Pullback) — bản đầy đủ. |
| [`DRALVO_INDICATOR_SPEC.md`](./DRALVO_INDICATOR_SPEC.md) | Spec indicator MT5 (Dralvo Gold Filter). |

> ⚠️ Nguồn sự thật **số liệu** = code [`src/lib/backtest-stats.ts`](../src/lib/backtest-stats.ts)
> (những con số landing page render). [`PRODUCT_PLAN.md §0`](./PRODUCT_PLAN.md) đã reconcile
> với file đó (2026-06-30): GoldMaster +792% / PF 2.40 · GoldScalp +139% / PF 1.89 ·
> TiGold +97.7% / PF 1.18. Các con số inline trong 3 doc chiến lược trên là **CŨ** —
> **chỉ dùng `backtest-stats.ts` / §0 cho marketing.**
>
> 🤝 Khách hàng / chăm sóc khách hàng: dùng [`KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md)
> (tài liệu tổng hợp sản phẩm + giá + cài đặt + FAQ + xử lý tình huống cho agent CSKH).

## 🛠️ Tài liệu vận hành / hạ tầng (dùng chung mọi version)

| Tài liệu | Vai trò |
|----------|---------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Kiến trúc runtime (Next.js + Supabase + Stripe). V2 dùng lại. (VietQR/Sepay đã gỡ 2026-06-29.) |
| [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) | Checklist trước khi deploy production. |
| [`RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md) | Quy trình release. |
| [`HARDENING_CHECKLIST.md`](./HARDENING_CHECKLIST.md) | Checklist bảo mật/độ cứng production. |
| [`DEPENDENCY_AUDIT.md`](./DEPENDENCY_AUDIT.md) | Đánh giá lỗ hổng phụ thuộc. |

## 🧑‍💻 Dev / bàn giao / QA

| Tài liệu | Vai trò |
|----------|---------|
| [`HANDOFF.md`](./HANDOFF.md) | **Runbook bàn giao session** — trạng thái kỹ thuật mới nhất, cạm bẫy, TODO. Đọc trước khi sửa code. |
| [`KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md) | Tổng hợp sản phẩm + giá + cài đặt + FAQ cho CSKH. |
| [`QA_TEST_CHECKLIST.md`](./QA_TEST_CHECKLIST.md) | Checklist test thủ công theo từng khu vực (đã cập nhật affiliate payout + anti-share `max_accounts`). |
| [`DASHBOARD_PLAN.md`](./DASHBOARD_PLAN.md) | Kế hoạch dashboard customer portal (license + EA) — phần lớn đã triển khai. |

## 🗄️ Doc V1 — giữ tham chiếu lịch sử (đã gắn banner cảnh báo)

Các doc sau mô tả sản phẩm **V1** (Pro tier / alert rules / thesis monitors) và
đã được gắn banner ở đầu file trỏ về nguồn sự thật V2. **Không dùng để ra quyết
định sản phẩm:** [`PROJECT_PLAN.md`](./PROJECT_PLAN.md),
[`PRODUCT_TRUTH_AND_STRATEGY.md`](./PRODUCT_TRUTH_AND_STRATEGY.md),
[`UI_UX_PRODUCTION_AUDIT.md`](./UI_UX_PRODUCTION_AUDIT.md). Phần feature V1 trong
[`ARCHITECTURE.md`](./ARCHITECTURE.md) và [`HARDENING_CHECKLIST.md`](./HARDENING_CHECKLIST.md)
cũng đã chú thích "đã gỡ".

## 🗄️ Lưu trữ — V1 SaaS (KHÔNG còn là căn cứ)

[`archive/v1-saas/`](./archive/v1-saas/) — toàn bộ tài liệu định hướng sản phẩm
V1. Giữ lại để tham chiếu lịch sử; **không dùng để ra quyết định sản phẩm.**
