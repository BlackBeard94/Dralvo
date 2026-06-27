# Dralvo — Dashboard Plan (V2 "Gold Cockpit")

> Dashboard cho khách đăng nhập của mô hình **thuê EA + tín hiệu**. Không phải
> "trang tải EA" — mà là **buồng lái giao dịch vàng**: lý do để khách mở mỗi
> ngày + biện minh phí định kỳ. Mọi widget gắn dữ liệu thật (không filler).
> Nguồn sự thật sản phẩm: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md). Design: [`DESIGN.md`](./DESIGN.md).

## 0. Nguyên tắc
- **Cockpit-first**: trang chủ là lưới widget thị trường + tín hiệu + robot, không phải menu.
- **Tier-aware** (Free / Pro $39 / Elite $99): 1 dashboard, mở khoá theo gói.
- **Mỗi widget = 1 nguồn dữ liệu/feature thật.** Không widget trang trí.
- **VPS KHÔNG nằm trong dashboard** — giao ngoài nền tảng kèm hướng dẫn setup khi mua.
- **UI trước, backend sau**: dựng UI với mock data để duyệt; OK rồi mới nối API.

## 1. IA / Sidebar
| # | Trang | Mô tả |
|---|---|---|
| 1 | **Tổng quan (Cockpit)** | Giá XAUUSD + chart, CFTC regime, Signal Tier 3A, Robot status, KPI, feed tín hiệu, tin tức, lịch kinh tế |
| 2 | **Robot của tôi** | EA theo gói · license key + bind MT5 account · tải `.ex5`/`.set` · hướng dẫn cài · health |
| 3 | **Tín hiệu** | Live + lịch sử + kết quả · VIP (Pro/Elite) · kết nối Telegram |
| 4 | **Hiệu suất** | Backtest vs live (Myfxbook nhúng), drawdown, kỳ vọng |
| 5 | **Backtest Lab** | Công cụ FX lab đã có (`/tools/backtest`) · backtest đã lưu / edge candidates |
| 6 | **Công cụ** | Tính lot/rủi ro, pip calculator, **lịch kinh tế** (FOMC/NFP/CPI) |
| 7 | **Tin tức vàng** | AI quét + tổng hợp nguồn (content engine) |
| 8 | **Học viện** | Onboarding, cách đọc CFTC, setup EA, bài học |
| 9 | **Thanh toán** | Gói, đổi kỳ hạn/upgrade/hủy (Stripe portal), hoá đơn |
| 10 | **Cài đặt** | Hồ sơ, ngôn ngữ (8), thông báo |
| — | **Admin** (ops, gate `isAdminEmail`) | cấp license, duyệt edge candidate, run-logs, source-health |

## 2. Cockpit (trang chủ) — bố cục widget
```
[ KPI strip: Equity · Lãi tháng · Vị thế mở · Win rate 90d ]
┌─────────────────────────────┬───────────────────────────┐
│ GIÁ XAUUSD + chart (live)    │ CFTC REGIME 🟢 (moat)     │
├─────────────────────────────┼───────────────────────────┤
│ SIGNAL HÔM NAY (Tier 3A)     │ ROBOT CỦA TÔI (health)    │
│ state · Entry/SL/TP · drivers│ Online · equity · license │
├─────────────────────────────┴───────────────────────────┤
│ TÍN HIỆU GẦN ĐÂY (feed + kết quả)                        │
├─────────────────────────────┬───────────────────────────┤
│ TIN TỨC VÀNG                 │ LỊCH KINH TẾ (FOMC/NFP/CPI)│
└─────────────────────────────┴───────────────────────────┘
```

## 3. Nguồn dữ liệu từng widget
| Widget | Nguồn | Trạng thái |
|---|---|---|
| Giá XAUUSD + chart | `/api/xauusd` + lightweight-charts | ✅ có |
| CFTC regime | `/api/cftc-status` | ✅ có |
| Signal Tier 3A | `/api/signal/current` | ✅ có |
| Robot status / health | `/api/ea/heartbeat` (EA POST định kỳ) | 🆕 cần build |
| Robot license | bảng `license_keys` + `/api/license/validate` | 🆕 cần build |
| KPI (equity, lãi tháng) | từ heartbeat | 🆕 |
| Feed tín hiệu + kết quả | lưu signal history | 🆕 |
| Tin tức vàng | AI content engine + nguồn (Finnhub/FF) | 🆕 |
| Lịch kinh tế | API free (Finnhub/Forex Factory) | 🆕 |
| Tools (lot/risk/pip) | thuần client (không cần backend) | 🆕 nhỏ |
| Backtest Lab | `/tools/backtest` đã có | ✅ |
| Billing | Stripe portal | ✅ |

## 3.1 Nguồn số liệu robot — Heartbeat (KHÔNG login MT5 vào web)

Khách **không nhập tài khoản/mật khẩu MT5** vào dashboard. Chính **EA đẩy số liệu về**
(EA đã gọi `dralvo.com` để lấy CFTC — mở rộng thành heartbeat):

```
EA (VPS) ──POST /api/ea/heartbeat (license key)──► Dralvo DB ──► Dashboard
  gửi: account number, broker, balance, equity, vị thế mở,
       P&L đóng theo MagicNumber của EA, tên+version, timestamp
```
- **An toàn**: chỉ cần license key, KHÔNG lưu creds broker.
- **Tách per-EA bằng MagicNumber** (GoldMaster `202606`, Scalp `99010101`) → biết P&L từng robot dù chạy chung 1 tài khoản.
- Gộp với **license validate** (1 ping = check license + báo trạng thái).
- (Tuỳ chọn sau) cho khách kết nối **Myfxbook** read-only nếu muốn xem cả lệnh tay.

## 3.2 Độ tươi dữ liệu (realtime?)
**Gần real-time (định kỳ), KHÔNG tick-by-tick** — đủ cho mục đích theo dõi.

| Dữ liệu | Độ tươi |
|---|---|
| Robot equity / vị thế / online | ~30–60s (nhịp heartbeat; WebRequest MT5 là blocking, không gửi mỗi tick) |
| Giá XAUUSD | định kỳ theo provider (Twelve Data throttle); tick stream thật cần feed trả phí |
| CFTC | hàng tuần (bản chất) · Signal Tier 3A | hàng ngày (D1) |

- **Khuyến nghị**: heartbeat 30–60s + dashboard **auto-refresh/poll ~30s**; nâng **SSE** sau nếu cần.
- Luôn hiện **"cập nhật X giây trước"** + chuyển **🔴 offline** khi heartbeat trễ > ngưỡng (vd 5 phút).
- Không cần tick-realtime: dashboard để **theo dõi**, không trade tay.

## 3.3 Hiển thị khi có nhiều EA (Elite)
- **Mỗi EA = 1 thẻ riêng** (license gắn theo số tài khoản MT5; P&L tách theo MagicNumber).
- 2 EA / 2 tài khoản → 2 thẻ độc lập (equity + đường vốn riêng). 2 EA / cùng 1 tài khoản → equity account hiện 1 lần, P&L tách theo magic.
- Cockpit: widget "Robot của tôi" liệt kê gọn cả 2; trang **Hiệu suất** có tab chuyển GoldMaster ↔ Gold Scalp.

## 4. Tier gating
- **Free**: Cockpit (giá, CFTC, signal cơ bản), Tools, Backtest Lab, Tin tức, Học viện, cộng đồng. → phễu, vẫn "dày".
- **Pro $39**: + Robot GoldMaster (license/download/health), VIP signals real-time.
- **Elite $99**: + Gold Scalp (2 EA), đa tài khoản, hỗ trợ ưu tiên, sớm tiếp cận.

## 5. Tái dùng từ V1 (giảm ~50% công)
- **Giữ & đổi nội dung**: `dashboard-shell`, `sidebar-nav`, `user-menu`, `billing-panel`, auth, Stripe portal, notifications, Telegram connect, run-logs, i18n, Supabase, `xauusd-chart`.
- **Bỏ/archive (Phase D)**: thesis (`today-thesis`, `thesis-timeline`, `thesis-replay`), `drivers`, `correlation`, `indicators`, evidence-alerts, `intelligence/*`, `api/thesis/*`.

## 6. Thứ tự triển khai
**A. UI trước (mock data) — để duyệt giao diện:**
- Route preview: `/dashboard-preview` (không auth, mock data) → dựng shell + cockpit + vài trang.
**B. Backend sau (khi UI OK):**
1. License system (`license_keys` + `/api/license/validate`) → "Robot của tôi".
2. EA heartbeat (`/api/ea/heartbeat`) → robot health + KPI.
3. Nối cockpit vào API thật (xauusd/cftc/signal đã có).
4. Tin tức + lịch kinh tế.
5. Chuyển preview → `/dashboard` thật (auth, tier-gate) + dọn V1.

## 7. MVP "dày & rẻ"
Cockpit (giá + CFTC + signal — API sẵn có) + Công cụ trader (calculator/lịch) + Robot/License. Chỉ với cockpit (UI trên API có sẵn) dashboard đã trông như buồng lái chuyên nghiệp.
