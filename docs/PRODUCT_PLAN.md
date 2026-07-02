# Dralvo — Plan Sản Phẩm

> **🎯 NGUỒN SỰ THẬT SẢN PHẨM DUY NHẤT (doc).**
> Cập nhật 2026-06-30 — đồng bộ với landing page hiện tại.
> ⚠️ Nguồn sự thật **số liệu** là code [`src/lib/backtest-stats.ts`](../src/lib/backtest-stats.ts)
> (đây là những con số landing page render). Bảng §0 dưới đây đã reconcile với file đó.
> Chi tiết migration code: [`V2_MIGRATION_MAP.md`](./V2_MIGRATION_MAP.md).

## Context

Dralvo bán **robot giao dịch vàng XAUUSD tự động** cho MetaTrader 5.
Sản phẩm chính là EA, website là mặt tiền bán hàng + customer portal + cổng affiliate/IB.

Moat: pipeline CFTC (`/api/cftc-status`) + backtest verified 3 EA + i18n 8 locale (vi/en/pt-BR/zh/hi…).

---

## 0. Bộ số backtest CHUẨN — 3 EA

Dralvo marketing mỗi EA bằng chính bộ số backtest đã kiểm chứng của nó (nguyên tắc
"no fake data"). 2 EA tính phí (VIP) + **TiGold free** để kéo traffic qua IB GTC.
Mọi số dưới đây đồng bộ với `src/lib/backtest-stats.ts` (2026-06-30).

### EA #1 — GoldMaster v1.08 · D1 Swing (LONG only)
Nguồn: MT5 Strategy Tester · XAUUSDm (Exness) · D1 · OHLC 1-min · 07/2018–06/2026 (~8 năm) · 1:500 · basis $10K · ATR trailing.

| Chỉ số | Giá trị THẬT (Risk 5% khuyến nghị) |
|---|---|
| Net Profit | **+792%** ($10K → $89,203) |
| Profit Factor | **2.40** |
| Win rate | **39.4%** (94 lệnh, 100% LONG) |
| Max DD | **23.6%** equity |
| R:R | **~3.7:1** · CAGR ~31.5%/năm |

Risk matrix: 1% → +77% (DD 6.2%) · 2% → +181% (DD 10.8%) · 3% → +327% (DD 15.3%) · 5% → +792% (DD 23.6%, khuyến nghị).

### EA #2 — GoldScalp v2.0 · M15 Momentum (Buy & Sell)
Nguồn: MT5 Strategy Tester · XAUUSD · M15 · tick thật 98% · 09/2023–06/2026 (~33 tháng) · basis $10K · re-optimized (genetic + real-tick verify).

| Chỉ số | Giá trị THẬT (Risk 2.0% khuyến nghị) |
|---|---|
| Net Profit | **+139%** ($10K → $23,899) |
| Profit Factor | **1.89** |
| Win rate | **~40%** (110 lệnh) |
| Max DD | **18.8%** equity |
| Lưu ý | Xanh mỗi năm: 2023 +19.7% · 2024 +11.6% · 2025 +15.7% · 2026 +9.9% |

### EA #3 — TiGold v3.0 · M1 Adaptive (FREE)
Nguồn: GTC MT5 Strategy Tester · XAUUSD · M1 · tick thật 100% · 01/2026–06/2026 (6 tháng) · basis $10K monthly-reset (max DD ≤30%) · config khuyến nghị DailyTarget 6%, fixed lot 0.08.

| Chỉ số | Giá trị THẬT (config khuyến nghị) |
|---|---|
| Net Profit | **+97.7%** ($10K → +$9,768 / 6 tháng) |
| Profit Factor | **1.18** |
| Win rate | **~76%** (1,105 lệnh) |
| Max DD | **28.1%** equity |
| Lưu ý | Chỉ 6 tháng — ghi rõ "edge mỏng, cần thêm dữ liệu". Miễn phí trọn đời khi mở tài khoản qua đối tác IB GTC của Dralvo. |

---

## 1. Mô hình sản phẩm (đã chốt — khớp landing page)

### FREE · $0
**TiGold EA** (M1 adaptive) — miễn phí trọn đời khi mở tài khoản qua link IB GTC của Dralvo.
- Tải `.ex5` + `.set` + hướng dẫn sau khi verify MT5 account number (`/tigold`)
- License kích hoạt qua Telegram [@dralvoea](https://t.me/dralvoea)
- Công cụ: Risk Manager (`/tools/calculator`) — tính lot, RR, prop firm

### Dralvo VIP · $59/mo
Nhãn hiển thị **VIP** (id nội bộ vẫn là `unlimited` trong DB/Stripe).
**Cả 3 EA**: GoldMaster + GoldScalp + TiGold.
- Download đầy đủ `.ex5` + `.set` cho từng EA, hỗ trợ đa tài khoản MT5, 1 VPS, ưu tiên hỗ trợ
- Giá: **$59/tháng** · **$319/6 tháng** (≈$53/mo, −10%) · **$599/năm** (≈$50/mo, −15%)
- Thanh toán: **Stripe** (toàn cầu). _VietQR/Sepay đã gỡ bỏ 2026-06-29._

| Tính năng | Free | VIP |
|---|:---:|:---:|
| TiGold EA | ✅ | ✅ |
| Risk Manager tool | ✅ | ✅ |
| GoldMaster EA | — | ✅ |
| GoldScalp EA | — | ✅ |
| Tải .ex5/.set tất cả EA | — | ✅ |
| Đa tài khoản MT5 + VPS + ưu tiên hỗ trợ | — | ✅ |

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
| `/dashboard` | Trang chính: license status, download EA, MT5 accounts | Free/VIP |
| `/dashboard/kho` | Kho EA — tải `.ex5`/`.set` theo tier | VIP |
| `/dashboard/settings` | Billing, ngôn ngữ, thông báo | Free/VIP |
| `/dashboard/chart`, `/drivers`, `/correlation`, `/indicators`, `/replay` | Phân tích thị trường (di sản V1, vẫn còn) | VIP |
| `/dashboard/alerts` | **Đã gỡ** — redirect về `/dashboard` (thông báo giờ = chuông + hộp thư) | — |
| `/affiliate`, `/partner/**` | Cổng affiliate/IB + partner | login |
| `/admin/**` | Bảng điều khiển admin (users, licenses, finance, affiliate, partners, vault…) | admin |

> Dashboard cốt lõi là **customer portal** — nơi khách quản lý license + tải EA.
> Một số trang phân tích V1 (chart/drivers/correlation…) vẫn còn trong codebase.

---

## 3. Cần BUILD gì (ưu tiên)

### Đã có (codebase hiện tại — 2026-06-30)
- ✅ Landing page 3-EA + pricing VIP ($59/mo · $319/6mo · $599/yr)
- ✅ `/tigold` IB flow (GTC verify → download → license)
- ✅ `/tools/calculator` Risk Manager
- ✅ `/compare`, `/track-record`
- ✅ Auth (Supabase email/password + Google OAuth)
- ✅ Stripe checkout + webhook
- ✅ **License system** (`license_keys` + `/api/license/validate` + cấp qua webhook)
- ✅ **Customer portal** `/dashboard` + `/dashboard/kho` (kho EA) + `/dashboard/settings`
- ✅ **Affiliate/IB** (`/affiliate`) + **Partner portal** (`/partner/**`)
- ✅ **Admin panel** (`/admin/**`: users, licenses, finance, marketing, affiliate, partners, vault…)
- ✅ i18n 8 locale (vi/en/pt-BR/zh/hi + fallback)
- ✅ `/api/xauusd`, `/api/cftc-status`, `/api/signal/current`, `/api/ib/verify`
- ✅ `backtest-stats.ts` — canonical numbers cho 3 EA
- ✅ Ad tracking (GA4 + Google Ads + Meta Pixel/CAPI + TikTok)

### Cần build
| Hạng mục | Mô tả | Ưu tiên |
|---|---|---|
| **EA heartbeat** | EA gửi heartbeat về để dashboard hiện online/offline + equity | #1 |
| **Telegram bot automation** | License activation + signal push tự động (hiện đang manual qua @dralvoea) | #2 |
| **Dọn V1 dashboard** | Cân nhắc gỡ chart/drivers/correlation/intelligence cũ (xem V2_MIGRATION_MAP.md) | #3 |

### Không build (YAGNI)
- ~~Indicator MT5 free~~ — TiGold đã là magnet free
- ~~AI content engine / news aggregator~~ — làm sau nếu có resource
- ~~VietQR/Sepay~~ — đã gỡ, chỉ giữ Stripe

---

## 4. Lộ trình

**Phase A — Customer Portal + License (✅ XONG):**
1. ✅ License system (`license_keys` + `/api/license/validate`) + Stripe webhook
2. ✅ Dashboard: license status + download EA (`/dashboard`, `/dashboard/kho`)
3. ✅ Affiliate/IB + Partner + Admin panel

**Phase B — Sau khi có khách trả tiền (hiện tại):**
4. EA heartbeat → dashboard live status + equity
5. Telegram bot automation (license activation, signal push) — thay manual @dralvoea
6. Dọn di sản V1 (chart/drivers/correlation) nếu xác nhận không dùng

---

## 5. Verification

- `npm run build && npm run lint` sạch
- Stripe checkout tạo subscription → webhook cấp license
- `/api/license/validate`: hợp lệ pass, hết hạn fail
- Khách VIP tải được `.ex5` + `.set` cả 3 EA
- Dashboard hiển thị đúng license status + download links
