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

> ⚠️ Số liệu backtest **canonical** nằm ở [`PRODUCT_PLAN.md §0`](./PRODUCT_PLAN.md)
> (PF 1.97 · Win 36.7% · +896% · DD 24.78% · 196 lệnh). Các con số inline trong 3
> doc chiến lược trên là CŨ và sẽ được reconcile khi backtest engine chạy lại —
> **chỉ dùng §0 cho marketing.**

## 🛠️ Tài liệu vận hành / hạ tầng (dùng chung mọi version)

| Tài liệu | Vai trò |
|----------|---------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Kiến trúc runtime (Next.js + Supabase + Stripe/VietQR). V2 dùng lại. |
| [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) | Checklist trước khi deploy production. |
| [`RELEASE_RUNBOOK.md`](./RELEASE_RUNBOOK.md) | Quy trình release. |
| [`HARDENING_CHECKLIST.md`](./HARDENING_CHECKLIST.md) | Checklist bảo mật/độ cứng production. |
| [`DEPENDENCY_AUDIT.md`](./DEPENDENCY_AUDIT.md) | Đánh giá lỗ hổng phụ thuộc. |

## 🗄️ Lưu trữ — V1 SaaS (KHÔNG còn là căn cứ)

[`archive/v1-saas/`](./archive/v1-saas/) — toàn bộ tài liệu định hướng sản phẩm
V1. Giữ lại để tham chiếu lịch sử; **không dùng để ra quyết định sản phẩm.**
