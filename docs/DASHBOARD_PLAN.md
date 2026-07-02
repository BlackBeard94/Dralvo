# Dralvo — Dashboard Plan (Customer Portal)

> Dashboard cho khách đăng nhập: **quản lý license + tải EA**.
> KHÔNG phải cockpit giao dịch — không chart, tín hiệu, CFTC regime.
> Nguồn sự thật sản phẩm: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md).

## 0. Nguyên tắc
- **Customer portal, không phải trading cockpit.** Khách vào để tải EA + xem license.
- **Tier-aware** (Free / Unlimited): Free thấy TiGold, Unlimited thấy cả 3 EA.
- **Đơn giản nhất có thể** — 2 trang là đủ.
- **Dùng lại code có sẵn**: `sidebar-nav`, `market-header`, auth, billing, i18n.

## 1. IA

| # | Trang | Mô tả | Tier |
|---|---|---|---|
| 1 | **Tổng quan** | License status, danh sách EA được phép tải, MT5 accounts, online status | Cả hai |
| 2 | **Cài đặt** | Billing (Stripe portal), ngôn ngữ, thông báo, đổi mật khẩu | Cả hai |

## 2. Trang Tổng quan — bố cục

```
[ Topbar: user + plan badge + theme + language ]
┌──────────────────────────────────────────────────────┐
│ LICENSE STATUS                                       │
│ Gói: Dralvo Unlimited · hết hạn: 28/12/2026          │
│ [Quản lý thanh toán]                                  │
├──────────────────────┬───────────────────────────────┤
│ EA #1: GoldMaster    │ EA #2: Gold Scalp             │
│ D1 Swing · Online 🟢 │ M15 Momentum · Online 🟢      │
│ License: còn 181 ngày│ License: còn 181 ngày         │
│ [Tải .ex5] [Tải .set]│ [Tải .ex5] [Tải .set]        │
│ MT5: #50123456       │ MT5: #50777012                │
├──────────────────────┴───────────────────────────────┤
│ EA #3: TiGold                                        │
│ M1 Adaptive · Miễn phí                               │
│ [Tải .ex5] [Tải .set] [Hướng dẫn]                    │
└──────────────────────────────────────────────────────┘
```

## 3. Nguồn dữ liệu

| Widget | Nguồn | Trạng thái |
|---|---|---|
| License status | Supabase `license_keys` (per-EA) + `/api/license/validate` | ✅ đã build |
| EA download links | Public `/downloads/` directory | ✅ có sẵn |
| EA online status | suy ra từ `license_devices.last_seen` (validate cập nhật mỗi lần EA gọi; "online" nếu < 15 phút) | ✅ đã build |
| MT5 accounts | `license_devices` (per-EA, cap = `max_accounts`; quản lý trong EA card). `license_keys.mt5_account` chỉ dùng cho key IB khóa-1-account khi `max_accounts ≤ 1` | ✅ đã build |
| Billing | Stripe Customer Portal | ✅ có sẵn |

## 4. Tier gating
- **Free**: hiện TiGold + nút "Nâng cấp lên Unlimited" → `/pricing`
- **Unlimited**: hiện cả 3 EA + đa tài khoản

## 5. Tái dùng từ V1
- `sidebar-nav.tsx` — sửa NAV_ITEMS còn 2 mục (Tổng quan + Cài đặt)
- `dashboard-shell.tsx` — layout sidebar + topbar + main
- `user-menu.tsx` — avatar + plan badge + logout
- `billing-panel.tsx` — Stripe portal link + plan info
- `market-header.tsx` — nếu muốn hiện giá XAUUSD nhỏ ở topbar
- Auth middleware — giữ nguyên

## 6. Xóa (Phase D)
- Toàn bộ V1 dashboard pages (`src/app/dashboard/**`)
- `cockpit-preview/page.tsx`
- `dashboard-redesign-preview/page.tsx`
- Components: `today-thesis`, `thesis-timeline`, `thesis-replay`, `drivers`, `correlation`, `indicators`, `alerts`, `alert-*`, `ai-provider-settings`
- `src/lib/intelligence/**`, `src/app/api/thesis/**`

## 7. Thứ tự triển khai
1. Build license system (`license_keys` migration + `/api/license/validate`)
2. Build `/dashboard` page — license status + download links
3. Build `/dashboard/settings` — reuse billing-panel
4. Gỡ V1 dashboard + preview pages
5. (Sau) EA heartbeat → online status
