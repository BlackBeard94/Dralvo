# Dralvo — Plan Sản Phẩm (Value Ladder, USD)

> **🎯 NGUỒN SỰ THẬT SẢN PHẨM DUY NHẤT (single source of truth).** Cập nhật
> 2026-06-17, duyệt qua plan mode.
> - Chi tiết migration code: [`V2_MIGRATION_MAP.md`](./V2_MIGRATION_MAP.md).
> - Chiến lược: [`DRALVO_STRATEGY_SYSTEM.md`](./DRALVO_STRATEGY_SYSTEM.md),
>   [`DRALVO_STRATEGY_COMPLETE.md`](./DRALVO_STRATEGY_COMPLETE.md),
>   [`DRALVO_INDICATOR_SPEC.md`](./DRALVO_INDICATOR_SPEC.md) — **số liệu phải khớp §0 dưới đây.**
> - Bản ecosystem plan gốc (2026-06-15) lưu tại `.hermes/plans/` (gitignored).

## Context

Hiện Dralvo chỉ có **1 sản phẩm**: EA auto-trade (`Dralvo_GoldEA`). Bán một EA
trần — không cộng đồng, không bằng chứng, không hỗ trợ — là cực khó, và một EA
đơn lẻ không biện minh được cho mô hình **3 mức giá**. Vấn đề thật không phải
"thiếu sản phẩm" mà là **thiếu một thang giá trị**: mỗi mức giá phải giải quyết
một "công việc" (job-to-be-done) khác hẳn.

Tài sản: **moat** = pipeline CFTC real-time (`/api/cftc-status` đang chạy) +
backtest 20 năm có kiểm chứng; **hệ chiến lược 5 tier theo khung giờ**; **EA**
(`../../dralvo-trading/mt5/`); **web app** (auth/billing/dashboard/data);
**Telegram infra**; **i18n**.

**Quyết định đã chốt:** Global / **USD / Stripe**; billing **hybrid** (signals =
subscription tháng, EA = license năm); **Tier 3 = bản đầy đủ signals + EA**
(copy-trade & mentorship pha sau).

---

## 0. Bộ số backtest CHUẨN — 2 EA bán SONG SONG

Dralvo bán **hai EA flagship song song**, mỗi EA marketing bằng **chính bộ số
backtest đã kiểm chứng của nó** (nguyên tắc "no fake data" — không trộn số). Đây
là số canonical cho mọi marketing/spec. Chi tiết sản phẩm: §3.5.

### EA #1 — GoldMaster v1.08 · D1 Swing (LONG only)
Nguồn: MT5 Strategy Tester · XAUUSD D1 · 2016–2026 (~10,3 năm) · data 98% · deposit $100k.

| Chỉ số | Giá trị THẬT |
|---|---|
| Net Profit (Risk 2% khuyến nghị) | **+263%** (~13,3%/năm kép) |
| Profit Factor | **2,4–2,7** |
| Win rate | **43,3%** (141 lệnh, 100% LONG) |
| Reward:Risk | **~3,3:1** |
| Max DD | 5,7% balance · **11,2% equity** (Risk 2%) |
| Sharpe / Recovery | 1,27 / 5,9 |
| Ma trận rủi ro | 1% +98% · 2% +263% · 3% +527% · 5% +1502% |

### EA #2 — Gold Scalp · M5 Momentum (Buy & Sell)
Nguồn: MT5 Strategy Tester · XAUUSDm M5 · 01–06/2026 (~5,5 tháng) · **100% tick thật** (49,7M ticks) · deposit $100k.

| Chỉ số | Giá trị THẬT |
|---|---|
| Net Profit | Safe(1%) **+68%** · Aggressive(2,5%) **+239%** |
| Profit Factor | **1,56** |
| Win rate | **64%** (308 lệnh) |
| Max DD | Safe ~9% · Aggressive ~13% |
| Recovery | **8,15** |
| Lưu ý | chỉ 5,5 tháng — ghi rõ "chưa qua nhiều chu kỳ" + bắt buộc forward-test demo |

> ⚠️ **Docs chiến lược cũ ghi win 50–60% là SAI** — số thật của từng EA ở trên.
> Bộ số 20 năm / 196 lệnh / PF 1,97 / +896% (từ `Dralvo_GoldEA` cũ trong
> `dralvo-trading`) là **legacy tham chiếu**, KHÔNG dùng marketing nữa (EA bán là
> GoldMaster + Gold Scalp). Backtest engine để reproduce/kiểm chứng, không phải
> nguồn số marketing (số marketing lấy từ MT5 report của mỗi EA).

---

## 1. Vấn đề lớn: Track-record & Trust → giải bằng MINH BẠCH KỲ VỌNG

**Vấn đề:** 2 EA có "tính cách" rủi ro khác nhau nên cách minh bạch cũng khác:
- **GoldMaster (D1 swing)**: LONG-only, **đứng yên khi CFTC bearish** (có thể trắng
  lệnh nhiều tháng) hoặc thua trong pha vàng giảm; win 43% → thua nhiều lần hơn thắng.
- **Gold Scalp (M5)**: giao dịch dày (308 lệnh/5,5 tháng), win 64% — nhưng **backtest
  mới 5,5 tháng**, chưa qua nhiều chu kỳ.

**Hướng giải (đã chốt): radical transparency.** Chính sự thành thật là moat —
khác hẳn đối thủ vẽ "win 90%". Cụ thể, kỳ vọng nói rõ NGAY TỪ ĐẦU cho TỪNG EA:

- **GoldMaster:** "Win rate ~43% — thua nhiều lần hơn thắng; edge ở R:R ~3,3:1.
  Max DD ~11%. **0 lệnh khi vàng bear = bảo toàn vốn**" (biến điểm yếu thành tính năng).
- **Gold Scalp:** "Win rate ~64%, PF 1,56, nhưng **chỉ 5,5 tháng backtest** (100%
  tick thật) — chưa đa chu kỳ. Bắt buộc forward-test demo trước khi vào tiền thật."
- Công khai **đầy đủ MT5 report của cả 2 EA** + live demo đúng như nó là (kể cả
  giai đoạn đứng yên/drawdown).
- Hệ quả: **không cần chờ 3 tháng track record để bán EA** — backtest thật +
  disclaimer minh bạch là đủ proof. Live record bồi đắp dần, công khai liên tục.

---

## 2. Nền tảng FREE (Trust Engine — điều kiện để mọi gói bán được + tự kiếm tiền qua IB)

| Thành phần | Mô tả | Trạng thái |
|---|---|---|
| **Indicator(s) FREE — scalp & intraday** | 1+ indicator MT5 cho **scalp/intraday (M5–M30 + intraday), KHÔNG phải H1/D1**. Giao dịch thường xuyên → luôn có hoạt động, hút traffic. Brand Dralvo + watermark Telegram. | ❌ Build mới |
| **Telegram channel (content engine)** | Nhiều hơn CFTC: ① CFTC regime 🟢/🟡/🔴 ② **AI quét setup → phát hiện & post signal** ③ **tin tức ảnh hưởng vàng từ nhiều nguồn** ④ **blog bài học educate khách**. | ❌ Build (AI + news + bot) |
| **Telegram group** | Group cộng đồng **liên kết với channel** — thảo luận, support cài đặt. | ❌ Lập |
| **IB funnel + rebate** | Đặt trong funnel Telegram. Offer **rebate tới $15/lot** khi giao dịch XAUUSD qua link Dralvo. Dralvo ăn IB commission, chia lại 1 phần làm rebate → magnet free cực mạnh. | ❌ Đăng ký IB + tracking |
| **Backtest + live record công khai** | Trang web hiển thị MT5 report 20 năm + equity curve + Myfxbook live (minh bạch). | ⚠️ Data có, cần engine + trang |

→ *Job của FREE: "Cho tôi công cụ dùng được ngay + chứng minh Dralvo thật."*
IB rebate kiếm tiền từ **cả user không trả phí**.

---

## 3. Thang sản phẩm (Free + 3 gói trả phí)

> Giá USD là **điểm khởi đầu để test**, chưa validate. Job-to-be-done là phần cố định.

### FREE · $0
Indicator scalp/intraday · **FX Backtest Tool công khai (§3.6 — cỗ máy kéo
traffic)** · Telegram content (CFTC + AI signal + news + blog) · community group ·
IB rebate $15/lot · backtest + live record công khai.

### TIER 1 — "Signal" · ~$29/mo · **subscription**
Tất cả FREE, cộng: **Indicator PRO** (đủ 5 strategy tier incl. D1 swing, **live
CFTC trên chart**, auto SL/TP, push alert) · **VIP Telegram** tín hiệu real-time
Entry/SL/TP · **Web dashboard** regime live + signal + historical replay.
→ *Job: "Nói chính xác khi nào & ở đâu vào lệnh." Khách tự execute.*

### TIER 2 — "Auto" · ~$499/yr · **license năm (hybrid)**
Tất cả TIER 1, cộng: **EA Dralvo GoldMaster** (D1 swing, xem §3.5) — license bind
MT5 account · hỗ trợ cài đặt.
→ *Job: "Để bot trade giúp tôi 24/5." Đây là nơi EA xuất hiện — MỘT bậc thang.*

### TIER 3 — "Elite" · ~$799/yr (hoặc $99/mo) · **hybrid**
Tất cả TIER 2, cộng: **EA Dralvo Gold Scalp** (M5 scalp, xem §3.5) → sở hữu CẢ HAI
EA · license **đa tài khoản** · **hỗ trợ ưu tiên 1-1** + early access chiến lược mới.
(Chừa hook pha **copy-trade / mentorship** vào đây hoặc tier 4 sau.)
→ *Job: "Toàn bộ hệ thống Dralvo, tự động hoá tối đa, ưu tiên."*

> **Bán lẻ (à la carte):** mỗi EA cũng bán riêng (không cần mua gói) với license +
> giá tháng/năm/vĩnh viễn riêng. Mua gói Auto/Elite = được cấp sẵn license EA tương ứng.

| Tính năng | Free | Signal | Auto | Elite |
|---|:---:|:---:|:---:|:---:|
| Indicator scalp/intraday + FX backtest tool + content + IB rebate | ✅ | ✅ | ✅ | ✅ |
| Indicator PRO (5 tier, live CFTC, alerts) | — | ✅ | ✅ | ✅ |
| VIP signals real-time + dashboard | — | ✅ | ✅ | ✅ |
| EA **GoldMaster** (D1 swing) + license | — | — | ✅ | ✅ |
| EA **Gold Scalp** (M5) + license đa account + ưu tiên 1-1 | — | — | — | ✅ |

---

## 3.5 Catalog EA (sản phẩm bán kèm license)

Hai EA đã hoàn thiện (nguồn + backtest tại `E:\EA Dralvo`). **Mỗi sản phẩm
marketing bằng CHÍNH bộ số backtest đã kiểm chứng của nó** (nguyên tắc "no fake
data") — không trộn số giữa các EA.

### A. Dralvo GoldMaster v1.08 — D1 Swing (LONG only)
- **Chiến lược:** CFTC + Trend + Pullback (productized của Tier 3A). EA **đã có
  WebRequest** gọi `https://www.dralvo.com/api/cftc-status` để lấy regime CFTC live.
- **Backtest:** XAUUSD · D1 · 02/2016–06/2026 (~10,3 năm) · data 98% · **141 lệnh** ·
  **win 43,3%** · **PF 2,4–2,7** · R:R ~3,3:1.
- **Ma trận rủi ro** (deposit $100k): Risk 1% → **+98%** (DD 5,6%/6,1%) · Risk 2%
  (khuyến nghị) → **+263%** (~13,3%/năm, DD 5,7%/11,2%) · Risk 3% → +527% · Risk 5% → +1502%.
- Recovery 5,9 · Sharpe 1,27 · 1 file `.set`.

### B. Dralvo Gold Scalp — M5 Momentum (Buy & Sell)
- **Chiến lược:** scalping theo xung lực, giữ lệnh TB ~10 phút. **KHÔNG** Grid/
  Martingale/DCA · **SL cứng mọi lệnh** · time-stop · lọc spread + dừng lỗ/ngày.
  Self-contained (**chưa có WebRequest** — cần thêm khi gắn license).
- **Backtest:** XAUUSDm · M5 · 01–17/06/2026 (~5,5 tháng) · **100% tick thật**
  (49,7M ticks) · **308 lệnh** · **win 64%** · **PF 1,56** · Recovery 8,15.
- **2 bộ .set:** Safe (Risk 1%) → **+68%**, DD ~9% · Aggressive (Risk 2,5%) →
  **+239%**, DD ~13%.
- ⚠️ Chỉ 5,5 tháng — ghi rõ "chưa qua nhiều chu kỳ" + bắt buộc forward-test demo.

> ✅ **ĐÃ CHỐT: trình bày CẢ HAI EA song song.** Landing + track-record + pricing
> hiển thị 2 sản phẩm cạnh nhau, mỗi EA dùng số của chính nó (§0). Bộ số GoldEA cũ
> (20 năm / 196 lệnh / PF 1,97 / +896%) thành **legacy**, gỡ khỏi marketing.
> **Tác động code (cần làm):** landing hiện là trang 1-EA dùng số GoldEA → đổi thành
> showcase 2 EA; `src/lib/backtest-stats.ts` + trang `/track-record` đổi từ 1 bộ số
> sang 2 (`GOLDMASTER_*` + `SCALP_*`).
>
> 🗄️ **Hợp nhất tài sản:** gom nguồn cả 2 EA (`E:\EA Dralvo`) vào repo private
> `dralvo-trading/mt5/` để version-control (như đã làm với GoldEA).

## 3.6 FREE: FX Backtest Tool (cỗ máy kéo traffic)

**Ý tưởng:** một công cụ web **miễn phí, không cần đăng nhập** — người dùng chọn
cặp FX + chiến lược mẫu (hoặc tham số đơn giản) → chạy backtest trên dữ liệu lịch
sử → xem equity curve + thống kê (PF, win rate, DD, số lệnh). Có thể share link.

**Vì sao:** SEO + nội dung chia sẻ được → kéo traffic tự nhiên về site; là phễu
đầu vào dẫn xuống Telegram / IB rebate / EA trả phí. Đây là "lead magnet" công cụ,
song song với indicator free.

**Build:** tái dùng logic engine `dralvo-trading/backtest/` → port sang web (API
serverless `/api/backtest` hoặc precompute kết quả các preset) + thêm dataset FX
(EURUSD, GBPUSD, USDJPY… ngoài XAUUSD). Có watermark + CTA về Telegram/EA.
Giới hạn rate-limit để không bị lạm dụng (như các API khác).

## 4. Cần BUILD gì (bám [`V2_MIGRATION_MAP.md`](./V2_MIGRATION_MAP.md))

| Cho | Hạng mục | Asset/Code |
|---|---|---|
| Nền | **Backtest engine** reproduce bộ số §0 | 🆕 `dralvo-trading/backtest/` (chưa tồn tại) |
| Free | **Indicator(s) scalp/intraday** MT5 | 🆕 build mới (không phải EA hiện có) |
| Free | **FX Backtest Tool** công khai (§3.6) `/api/backtest` + UI `/tools/backtest` | 🆕 port từ `dralvo-trading/backtest/` + dataset FX |
| Free | **AI content engine**: quét setup→signal + news aggregator nhiều nguồn + blog | 🆕; có thể repurpose `ai-signal.ts` (V1) + `user/ai-credentials` |
| Free, Signal | **Telegram bot V2** (channel content + VIP signals) + group liên kết | 🔶 `api/telegram/*` + `lib/notifications/*` |
| Free | **IB rebate tracking** ($15/lot) trong funnel | 🆕 + đăng ký IB broker |
| Free, mọi tier | **Trang track record công khai** (MT5 report + Myfxbook + equity curve) | 🆕 + minh bạch kỳ vọng (§1) |
| Signal+ | **Signal API `/api/signal/current`** (unblock indicator/EA/Telegram/dashboard) | 🆕 từ `src/data/ingestion/*` + `/api/cftc-status` |
| Signal | **Indicator PRO** (5 tier, live CFTC, alerts) | indicator + WebRequest → signal API |
| Signal | **Dashboard** regime live + replay | 🔶 regime mới; replay V1 có sẵn |
| Auto/Elite | **License system** `/api/license/validate` + bảng `license_keys` (user_id, product `goldmaster`/`scalp`, key, mt5_account, expires_at, active) | 🆕 + Stripe webhook cấp license khi mua gói |
| Auto | **EA GoldMaster** (D1) + license check | ✅ EA có sẵn — **reuse WebRequest** đang gọi cftc-status để gọi `/api/license/validate` |
| Elite | **EA Gold Scalp** (M5) + license check | ✅ EA có sẵn — **cần THÊM WebRequest** (Scalp chưa có) + bind `ACCOUNT_LOGIN` |
| Mọi gói | **Pricing/checkout 3 tier USD/Stripe** | 🔶 `pricing/page.tsx`, `lib/stripe*` + price IDs |

---

## 5. Lộ trình build

**Phase A — Trust Engine (FREE, ưu tiên #1, tự kiếm tiền IB ngay):**
1. Backtest engine → **hoà giải số liệu (§3.5): chốt 1 bộ số chuẩn cho GoldMaster**
   và cập nhật §0 + landing + 3 doc chiến lược cho khớp.
2. Indicator(s) scalp/intraday FREE.
3. **FX Backtest Tool công khai (§3.6)** — `/api/backtest` + `/tools/backtest` + dataset FX.
4. Signal API `/api/signal/current` (unblock mọi thứ).
5. Telegram bot V2 + content engine (CFTC + AI signal + news + blog) + group.
6. Trang track record công khai (minh bạch §1) + dựng demo/Myfxbook chạy EA.
7. Đăng ký IB + rebate $15/lot trong funnel Telegram.
8. Hợp nhất nguồn 2 EA (`E:\EA Dralvo`) vào repo private `dralvo-trading/mt5/`.

**Phase B — Mặt tiền + bán TIER 1 (Signal):**
9. Landing/pricing/i18n sang V2 + bảng 3 tier (USD).
10. Indicator PRO (5 tier, live CFTC, alerts) + VIP Telegram signals.
11. Dashboard regime live + replay. Stripe checkout Tier 1.

**Phase C — Bán TIER 2/3 + 2 EA (dùng backtest thật + disclaimer minh bạch làm proof):**
12. License system (`license_keys` + `/api/license/validate`) + Stripe webhook cấp license khi mua.
13. Gắn license check vào **GoldMaster** (reuse WebRequest sẵn có) → bán Tier 2 / EA lẻ.
14. Thêm WebRequest + license check vào **Gold Scalp** → bán Tier 3 / EA lẻ + đa-account.
15. Trang sản phẩm từng EA (port marketing có sẵn ở `E:\EA Dralvo`) + checkout/giá lẻ.

**Phase D — Dọn V1** (sau khi V2 thay thế chạy): redirect `/dashboard→/`, xoá
`intelligence/*`, `api/thesis/*`, dashboard UI (mục 3 `V2_MIGRATION_MAP.md`).
Lợi ích phụ: hết lỗi `tsc`.

> Mỗi phase nhiều commit nhỏ; verify `npm run build && npm run test` trước khi sang phase sau.

---

## 6. Doanh thu
- **IB rebate/commission**: từ MỌI user kể cả free — dòng tiền sớm nhất, passive.
- **Subscription** Tier 1 (+ phần monthly Tier 3): recurring.
- **EA bán lẻ + License** (GoldMaster, Gold Scalp): bán riêng từng EA (tháng/năm/
  vĩnh viễn, 1 license/1 MT5 account) HOẶC gói Auto/Elite cấp sẵn license. Đây là
  doanh thu giá trị cao nhất hiện có (2 EA đã hoàn thiện + có backtest).
- Pha sau: copy-trade / khóa học / mentorship gắn Tier 3 hoặc tier 4.

Phễu: Free (indicator + **FX backtest tool** + content + IB rebate) → IB ngay →
upsell Signal → Auto (GoldMaster) → Elite (+ Gold Scalp).

---

## 7. Verification

**Kỹ thuật:**
- `npm run build && npm run test && npm run lint` sạch mỗi phase.
- Backtest engine reproduce đúng bộ số §0 (PF 1.97, +896%, win 37%).
- `/api/signal/current` trả JSON đúng; EA + indicator đọc được qua WebRequest.
- `/api/license/validate`: hợp lệ pass, hết hạn/sai MT5 account fail; GoldMaster +
  Gold Scalp gọi được qua WebRequest (Scalp đã thêm WebRequest + allow URL).
- `/api/backtest` (FX tool) trả equity curve + metrics đúng; có rate-limit + watermark.
- Stripe checkout tạo đúng sub/license cho từng price ID; webhook cấp `license_keys`.
- Telegram bot post đúng (CFTC + AI signal + news); indicator scalp đúng checklist.

**Business / trust:**
- Trang track record hiển thị MT5 report + Myfxbook khớp tín hiệu Telegram.
- Kỳ vọng minh bạch (win 37%, chuỗi thua 10, DD 25%) xuất hiện rõ trên web/onboarding.
- Funnel Free→IB và Free→Signal đo được (`api/analytics/events` có sẵn).

---

## Câu hỏi mở (quyết khi triển khai, không chặn plan)
- Con số giá cuối ($29/$499/$799 chỉ khởi điểm) — test với user thật.
- **Giá bán lẻ từng EA** (GoldMaster, Gold Scalp): tháng / năm / vĩnh viễn?
- ~~Hoà giải số liệu~~ ✅ ĐÃ CHỐT: trình bày cả 2 EA song song (§3.5), GoldEA cũ = legacy.
- **FX Backtest Tool:** preset chiến lược cố định hay cho user tự nhập tham số?
  Dataset FX lấy nguồn nào (đồng bộ chất lượng/độ dài lịch sử)?
- Broker IB chính (Exness/IC Markets/XM…) để chốt mức rebate $15/lot.
- AI content: dùng model nào, mức tự động (auto-post vs human-review) cho signal/news.
- Scalp indicator FREE: là chiến lược CFTC thu nhỏ hay TA thuần để hút traffic.
