# Dralvo V2 — Bản đồ Migration Codebase

> Đồng bộ 2026-06-28 với [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md) hiện tại.
> **Quy ước:** ✅ KEEP · 🔶 MODIFY · ❌ DELETE · 🆕 NEW

---

## 1. Tài sản lõi — GIỮ NGUYÊN

| Path | Loại | Lý do |
|------|------|-------|
| `src/data/ingestion/**` | ✅ | Pipeline CFTC/COMEX/GLD/TIPS/XAUUSD |
| `src/data/driver-registry.ts` | ✅ | Driver definitions |
| `src/data/indicators.ts` | ✅ | Types OHLC |
| `src/lib/supabase/**` | ✅ | Auth client/server/admin |
| `src/lib/{utils,i18n,rate-limit,run-logs,admin,api-auth,product-analytics}.ts` | ✅ | Infrastructure |
| `src/lib/monitoring/**` | ✅ | Freshness + source-alerts |
| `src/lib/{stripe,stripe-subscriptions,subscription-gate,sepay,vietqr}.ts` | ✅ | Billing |
| `src/app/api/{stripe,sepay,vietqr}/**` | ✅ | Payment endpoints |
| `src/app/api/ingest/**` | ✅ | Cron ingest |
| `src/app/api/ops/**` | ✅ | Admin endpoints |
| `src/app/api/{health,analytics/events,waitlist}/**` | ✅ | Infrastructure |
| `src/app/api/{xauusd,cftc-status,drivers/history,indicators}/**` | ✅ | Data endpoints |
| `src/app/api/signal/current/route.ts` | ✅ | Signal API |
| `src/app/{login,signup,reset-password,auth/callback}/**` | ✅ | Auth |
| `src/app/{privacy,terms,disclaimer}/**` | ✅ | Legal |
| `src/app/{page,tigold,pricing,compare,track-record}/**` | ✅ | Public pages |
| `src/app/tools/calculator/**` | ✅ | Risk Manager |
| `src/app/layout.tsx` | ✅ | Root layout |
| `src/lib/backtest-stats.ts` | ✅ | Canonical EA numbers |
| `src/lib/landing-copy.ts` | ✅ | Landing copy (vi/en) |
| `src/components/{shared,marketing,ui}/**` | ✅ | Shared UI |
| `supabase/migrations/**` | ✅ | DB schema |

---

## 2. Sửa / Repurpose

| Path | Loại | Việc cần làm |
|------|------|--------------|
| `src/components/dashboard/sidebar-nav.tsx` | 🔶 | Sửa NAV_ITEMS: 2 mục (Tổng quan + Cài đặt) |
| `src/components/dashboard/dashboard-shell.tsx` | 🔶 | Dùng cho customer portal layout |
| `src/components/dashboard/user-menu.tsx` | 🔶 | Giữ, dùng trong dashboard mới |
| `src/components/dashboard/billing-panel.tsx` | 🔶 | Giữ, đưa vào settings page |
| `src/components/dashboard/market-header.tsx` | 🔶 | Cứu: dùng nếu muốn hiện giá XAUUSD ở topbar |
| `src/components/dashboard/xauusd-chart.tsx` | 🔶 | Cứu: có thể dùng ở public pages |

---

## 3. Xóa / Archive

| Path | Loại |
|------|------|
| `src/app/dashboard/**` (tất cả trang con) | ❌ |
| `src/app/cockpit-preview/**` | ❌ |
| `src/app/dashboard-redesign-preview/**` | ❌ |
| `src/app/methodology/**` | ❌ |
| `src/components/dashboard/` — trừ file ở mục 2 | ❌ |
| `src/lib/intelligence/**` | ❌ |
| `src/app/api/thesis/**` | ❌ |
| `src/app/api/export/csv/**` | ❌ |
| `src/app/api/user/ai-credentials/**` + `src/lib/ai-credentials.ts` | ❌ |
| `src/lib/notifications/**` (nếu không dùng Telegram push) | ❌ |

---

## 4. Tạo mới

| Path | Loại | Mô tả |
|------|------|-------|
| `src/app/dashboard/page.tsx` | 🆕 | Customer portal: license status + download EA |
| `src/app/dashboard/settings/page.tsx` | 🆕 | Settings: billing + language + notifications |
| `src/app/api/license/validate/route.ts` | 🆕 | License validation |
| `supabase/migrations/<ts>_license_keys.sql` | 🆕 | Bảng license_keys |

---

## 5. Thứ tự thực thi

1. **License system**: migration `license_keys` + `/api/license/validate`
2. **Customer portal**: `/dashboard` + `/dashboard/settings` (dùng mock data trước, nối license sau)
3. **Sửa sidebar-nav**: 2 items
4. **Gỡ V1**: xóa toàn bộ mục 3, verify `npm run build`
5. **EA heartbeat**: sau khi có khách thật
