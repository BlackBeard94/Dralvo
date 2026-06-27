# Dralvo — Plan Sản Phẩm

> **🎯 NGUỒN SỰ THẬT SẢN PHẨM DUY NHẤT.**
> Cập nhật 2026-06-28 — đồng bộ với landing page hiện tại.
> Chi tiết migration code: [`V2_MIGRATION_MAP.md`](./V2_MIGRATION_MAP.md).

## Context

Dralvo bán **robot giao dịch vàng XAUUSD tự động** cho MetaTrader 5.
Sản phẩm chính là EA, website là mặt tiền bán hàng + customer portal.

Moat: pipeline CFTC (`/api/cftc-status`) + backtest verified 2 EA + i18n (vi/en/pt-BR).

---

## 0. Bộ số backtest CHUẨN — 2 EA bán SONG SONG

Dralvo bán **hai EA flagship song song**, mỗi EA marketing bằng chính bộ số
backtest đã kiểm chứng của nó (nguyên tắc "no fake data"). Ngoài ra có **TiGold
free** để kéo traffic qua IB.

### EA #1 — GoldMaster v1.08 · D1 Swing (LONG only)
Nguồn: MT5 Strategy Tester · XAUUSD D1 · 2016–2026 (~10,3 năm) · data 98% · deposit $100k.

| Chỉ số | Giá trị THẬT |
|---|---|
| Net Profit (Risk 5% khuyến nghị) | **+1502%** |
| Profit Factor | **2.65** |
| Win rate | **43.3%** (141 lệnh, 100% LONG) |
| Max DD | **23.8%** equity (Risk 5%) |
| R:R | **3.33:1** |

### EA #2 — Gold Scalp · M5 Momentum (Buy & Sell)
Nguồn: MT5 Strategy Tester · XAUUSDm M5 · 01–06/2026 (~5,5 tháng) · **100% tick thật** · deposit $100k.

| Chỉ số | Giá trị THẬT |
|---|---|
| Net Profit (Risk 2.5% khuyến nghị) | **+234%** |
| Profit Factor | **1.56** |
| Win rate | **64%** (308 lệnh) |
| Max DD | **12.9%** equity |
| Lưu ý | chỉ 5,5 tháng — ghi rõ "chưa qua nhiều chu kỳ" |

### EA #3 — TiGold v2.0 · M1 Adaptive (FREE)
Nguồn: MT5 Strategy Tester · XAUUSD M1 · 01/2023–06/2026 · 100% ticks.
Miễn phí trọn đời khi mở tài khoản qua đối tác IB Dralvo.

---

## 1. Mô hình sản phẩm (đã chốt — khớp landing page)

### FREE · $0
**TiGold EA** (M1 adaptive) — miễn phí trọn đời khi mở tài khoản qua link IB Dralvo.
- Tải `.ex5` + `.set` + hướng dẫn sau khi verify MT5 account number
- License kích hoạt qua Telegram `@dralvo`
- Công cụ: Risk Manager (`/tools/calculator`) — tính lot, RR, prop firm

### Dralvo Unlimited · $59/mo (hoặc $599/yr −15%)
**Cả 3 EA**: GoldMaster + Gold Scalp + TiGold.
- Download đầy đủ `.ex5` + `.set` cho từng EA
- Hỗ trợ đa tài khoản MT5
- Thanh toán: Stripe (toàn cầu) + Sepay/VietQR (VN)

| Tính năng | Free | Unlimited |
|---|:---:|:---:|
| TiGold EA | ✅ | ✅ |
| Risk Manager tool | ✅ | ✅ |
| GoldMaster EA | — | ✅ |
| Gold Scalp EA | — | ✅ |
| Tải .ex5/.set tất cả EA | — | ✅ |
| Đa tài khoản MT5 | — | ✅ |

---

## 2. Website — cấu trúc

Trang web là **mặt tiền bán hàng + customer portal đơn giản**.

### Public pages (không cần login)
| Route | Nội dung |
|---|---|
| `/` | Landing: hero + 3 EA cards + evidence + pricing + FAQ |
| `/tigold` | TiGold standalone: IB verify → download → license |
| `/pricing` | Bảng giá chi tiết |
| `/tools/calculator` | Risk Manager (position size, RR, prop firm) |
| `/compare` | So sánh 3 EA |
| `/track-record` | Hiệu suất công khai |
| `/login`, `/signup`, `/reset-password` | Supabase Auth |

### Customer portal (cần login)
| Route | Nội dung | Tier |
|---|---|---|
| `/dashboard` | Trang chính: license status, download EA, MT5 accounts | Free/Unl |
| `/dashboard/settings` | Billing, ngôn ngữ, thông báo | Free/Unl |

> Dashboard là **customer portal** — nơi khách quản lý license + tải EA.
> KHÔNG phải "cockpit giao dịch" — không có chart, tín hiệu, CFTC regime.
> Những thứ đó nằm ở public pages (landing evidence) hoặc Telegram.

---

## 3. Cần BUILD gì (ưu tiên)

### Đã có (codebase hiện tại)
- ✅ Landing page 3-EA + pricing $59/mo
- ✅ `/tigold` IB flow
- ✅ `/tools/calculator` Risk Manager
- ✅ `/compare`, `/track-record`
- ✅ Auth (Supabase email/password + Google OAuth)
- ✅ Stripe checkout + webhook
- ✅ Sepay/VietQR
- ✅ i18n (vi/en + 6 fallback)
- ✅ `/api/xauusd`, `/api/cftc-status`, `/api/signal/current`
- ✅ `backtest-stats.ts` — canonical numbers cho 3 EA

### Cần build
| Hạng mục | Mô tả | Ưu tiên |
|---|---|---|
| **Customer portal** `/dashboard` | License status + download EA + MT5 account management | #1 |
| **License system** | Bảng `license_keys` + `/api/license/validate` + Stripe webhook cấp license | #1 |
| **EA heartbeat** | EA gửi heartbeat về để dashboard hiện online/offline + equity | #2 |
| **Gỡ V1 dashboard** | Xóa thesis/intelligence/drivers/correlation cũ (xem V2_MIGRATION_MAP.md) | #3 |

### Không build (YAGNI)
- ~~Indicator MT5 free~~ — chưa cần, TiGold đã là magnet free
- ~~AI content engine / news aggregator~~ — làm sau nếu có resource
- ~~Telegram bot V2~~ — giữ manual Telegram `@dralvo` như hiện tại
- ~~FX Backtest Tool công khai~~ — Risk Manager đã cover tool free
- ~~IB rebate tracking~~ — chưa có tracking system

---

## 4. Lộ trình

**Phase A — Customer Portal (hiện tại):**
1. License system (`license_keys` + `/api/license/validate`) + Stripe webhook
2. Dashboard đơn giản: license status + download EA
3. Gỡ V1 dashboard + preview pages

**Phase B — Sau khi có khách trả tiền:**
4. EA heartbeat → dashboard live status + equity
5. Telegram bot automation (license activation, signal push)
6. Mở rộng nếu có nhu cầu thật

---

## 5. Verification

- `npm run build && npm run lint` sạch
- Stripe checkout tạo subscription → webhook cấp license
- `/api/license/validate`: hợp lệ pass, hết hạn fail
- Khách Unlimited tải được `.ex5` + `.set` cả 3 EA
- Dashboard hiển thị đúng license status + download links
