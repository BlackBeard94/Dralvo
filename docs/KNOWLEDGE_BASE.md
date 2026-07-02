# Dralvo — Knowledge Base cho Agent Chăm Sóc Khách Hàng

> **Mục đích:** Tài liệu duy nhất để agent (người hoặc AI) trả lời khách hàng Dralvo:
> sản phẩm, giá, cài đặt, license, xử lý sự cố, và quy tắc giao tiếp.
> **Cập nhật:** 2026-06-30 · đồng bộ với `src/lib/backtest-stats.ts`, `landing-copy.ts`,
> `tigold-copy.ts`, `plan.ts`, và trang `/pricing`, `/tigold`.
> **Khi số liệu mâu thuẫn:** nguồn sự thật là code `src/lib/backtest-stats.ts`.

---

## 0. TL;DR — Trả lời nhanh nhất

- **Dralvo bán gì?** Robot giao dịch vàng **XAUUSD** tự động (Expert Advisor) cho **MetaTrader 5**.
- **Có mấy robot?** 3 — **TiGold** (miễn phí), **GoldScalp** và **GoldMaster** (gói VIP).
- **Giá VIP?** **$59/tháng** · $319/6 tháng · $599/năm. Thanh toán **Stripe**. Hủy bất cứ lúc nào.
- **TiGold miễn phí thế nào?** Mở tài khoản THẬT qua **đối tác IB GTC** + nạp tối thiểu **$50 / 5.000 cent** → license vĩnh viễn (1 tài khoản MT5). Kích hoạt qua bot **@dralvo_bot** (gõ "license").
- **Hỗ trợ:** Telegram **[@dralvoea](https://t.me/dralvoea)** · pháp lý/dữ liệu: **legal@dralvo.com** · web **dralvo.com**.
- **Quy tắc vàng:** KHÔNG bao giờ hứa lợi nhuận. Mọi số là **backtest quá khứ**, không bảo đảm tương lai.

---

## 1. Dralvo là gì

Dralvo là hệ sinh thái trader vàng: bán robot EA giao dịch **XAUUSD** tự động trên **MT5**.
Website `dralvo.com` là mặt tiền bán hàng + cổng khách hàng (quản lý license, tải EA) +
cổng affiliate/IB.

**Tinh thần thương hiệu — "No fake data":** mỗi robot được marketing bằng **chính bộ số
backtest đã kiểm chứng** của nó trên MT5 Strategy Tester. Không hứa hẹn "100%/tháng",
không "robot thần thánh". Logic mỗi EA rõ ràng, minh bạch.

- **Slogan:** "Drill Into Gold"
- **Định vị:** công cụ giao dịch tự động có kỷ luật, minh bạch — KHÔNG phải nhóm tín hiệu,
  KHÔNG phải copy-trade hứa hẹn làm giàu nhanh.
- **Không cam kết lợi nhuận.** "Chúng tôi cung cấp công cụ, không bán lời hứa."

---

## 2. Sản phẩm — 3 Robot (EA)

Tất cả: XAUUSD · MetaTrader 5 · không Martingale / không Grid · mỗi lệnh giới hạn rủi ro rõ ràng.

### 2.1 Dralvo TiGold v3.0 — MIỄN PHÍ
- **Phong cách:** Adaptive momentum trên **M1** (theo tick), giao dịch **2 chiều (Buy & Sell)**.
- **Cách hoạt động:** phát hiện momentum qua tick → vào theo hướng chạy → thoát bằng trailing stop có step.
- **3 lớp bảo vệ vốn:** (1) chuỗi thua → tạm nghỉ, (2) lỗ ngày vượt ngưỡng → dừng, tự reset hôm sau,
  (3) news filter — né tin quan trọng (dùng MT5 calendar). Có time filter (mặc định 8h–22h giờ server).
- **Mô hình:** monthly-reset — mỗi tháng coi như reset về $10K, khóa lời **+6%/ngày** rồi dừng (giữ DD ≤ ~30%).
- **Ai nên dùng:** người mới, vốn nhỏ, muốn thử EA không tốn phí.
- **Điều kiện:** tài khoản MT5 **THẬT** mở qua **link IB GTC** của Dralvo + nạp tối thiểu **$50 (USD) / 5.000 cent (Cent)**. Demo không đủ điều kiện license.
- **Backtest (config khuyến nghị — DailyTarget 6%, fixed lot 0.08):**
  - Nguồn: GTC MT5 Strategy Tester · XAUUSD M1 · 01–06/2026 (6 tháng) · **tick thật 100%** · $10K.
  - Net **+97.7%** ($10K → +$9,768/6 tháng) · PF **1.18** · Win **~76%** (1,105 lệnh) · Max DD **28.1%**.
  - Lưu ý phải nói rõ với khách: chỉ **6 tháng dữ liệu — edge mỏng, cần thêm thời gian kiểm chứng**.

### 2.2 Dralvo GoldScalp v2.0 — VIP
- **Phong cách:** Momentum / scalp trên **M15**, **2 chiều (Buy & Sell)**.
- **Cách hoạt động:** đọc **regime** thị trường (ADX + EMA: đi ngang / xu hướng / chuyển tiếp) → chọn 1 trong 3 setup:
  - *Breakout + Retest* · *Fakeout + Reclaim* · *Range Fade* (mặc định tắt).
  - **Pyramid "tiền nhà":** chỉ nhồi thêm khi rổ đã hòa vốn, khối lượng giảm dần — không để rổ đang lời quay về âm.
  - Trailing rổ thông minh (ATR hoặc swing structure), đóng cả rổ khi gãy cấu trúc.
- **Ai nên dùng:** trader chủ động, hiểu cấu trúc giá.
- **Backtest (Risk 2.0% khuyến nghị):**
  - Nguồn: MT5 Strategy Tester · XAUUSD M15 · **tick thật 98%** · 09/2023–06/2026 (~33 tháng) · $10K · re-optimized.
  - Net **+139%** ($10K → $23,899) · PF **1.89** · Win **~40%** (110 lệnh) · Max DD **18.8%**.
  - **Xanh mỗi năm:** 2023 +19.7% · 2024 +11.6% · 2025 +15.7% · 2026 +9.9%.
  - Risk matrix: 1.0%→+57% (DD 9.7%) · 1.5%→+96% (DD 14.3%) · 2.0%→+139% (DD 18.8%) · 2.5%→+158% (DD 28.6%).

### 2.3 Dralvo GoldMaster v1.08 — VIP
- **Phong cách:** Trend-following dài hạn trên **D1**, **CHỈ LONG (mua)**.
- **Cách hoạt động:**
  - **CFTC filter** — đọc vị thế tổ chức vàng COMEX (cập nhật hàng tuần), chỉ mua khi tổ chức bullish. *(Điểm độc quyền — không EA nào khác có.)*
  - **Higher-Low filter** (đáy cao dần 20 ngày) + **EMA 50/200 crossover** + **Pullback entry** (vào khi giá hồi về vùng chiết khấu).
  - **Trail2 exit** (trailing theo đỉnh cao nhất × ATR) · **Max hold 60 ngày** · **Cooldown 5 ngày** giữa các lệnh.
  - Hỗ trợ API live (tự pull CFTC) hoặc CSV offline.
- **Ai nên dùng:** nhà đầu tư dài hạn, không muốn theo dõi hàng ngày.
- **Lưu ý quan trọng:** vì LONG-only, khi vàng giảm (CFTC bearish) → **0 lệnh = bảo toàn vốn, KHÔNG phải lỗi**.
- **Backtest (Risk 5% khuyến nghị):**
  - Nguồn: MT5 Strategy Tester · XAUUSDm (Exness) · D1 · OHLC 1-min · 07/2018–06/2026 (~8 năm) · 1:500 · $10K.
  - Net **+792%** ($10K → $89,203) · PF **2.40** · Win **39.4%** (94 lệnh) · Max DD **23.6%** · R:R **~3.7:1** · CAGR ~31.5%/năm.
  - Risk matrix: 1%→+77% (DD 6.2%) · 2%→+181% (DD 10.8%) · 3%→+327% (DD 15.3%) · 5%→+792% (DD 23.6%).

> **"Win rate chỉ 39% sao vẫn lãi?"** → Vì mỗi lệnh thắng lớn hơn nhiều mỗi lệnh thua (R:R ~3.7:1).
> Thua nhiều lần hơn nhưng mỗi lần thắng đủ to để dẫn dắt hiệu suất — lợi thế **bất đối xứng**.

---

## 3. Bảng giá & Gói

| | **Free** | **Dralvo VIP** |
|---|---|---|
| Giá | $0 | **$59/tháng** · **$319/6 tháng** (≈$53/mo, −10%) · **$599/năm** (≈$50/mo, −15%) |
| TiGold EA | ✅ | ✅ |
| GoldScalp EA | — | ✅ |
| GoldMaster EA | — | ✅ |
| Tải `.ex5` + `.set` tất cả EA | — | ✅ |
| Risk Manager (tính lot) | ✅ | ✅ |
| Đa tài khoản MT5 | — | ✅ |
| VPS đi kèm | — | ✅ (1 VPS) |
| Telegram | Community | **VIP** |
| Truy cập sớm EA mới + ưu tiên hỗ trợ | — | ✅ |
| Điều kiện | Tài khoản thật qua IB GTC + nạp tối thiểu $50/5.000 cent | Trả phí |

- **Nhãn gói trả phí hiển thị là "VIP"** (id nội bộ trong hệ thống là `unlimited`).
- **Thanh toán:** **Stripe** (toàn cầu). *VietQR/Sepay đã ngừng từ 2026-06-29 — đừng hứa chuyển khoản VN.*
- **Dùng thử:** một số gói VIP mới có thể có **3 ngày dùng thử**; phí định kỳ bắt đầu khi hết thử nếu không hủy.
- **Hủy:** bất cứ lúc nào qua billing portal; **quyền VIP vẫn chạy hết kỳ đã thanh toán**. Không ràng buộc hợp đồng.
- **Hoàn tiền:** **không có chính sách hoàn tiền mặc định** — phụ thuộc thông tin tại checkout/hóa đơn.
  → Agent **không tự hứa hoàn tiền**; ghi nhận và chuyển admin xem xét từng trường hợp.

---

## 4. Mua hàng & Bắt đầu

### 4.1 Lấy TiGold (Free) — qua IB GTC, trang `/tigold`
1. **Mở tài khoản GTC** qua link đối tác Dralvo (GTC là broker độc quyền). Chọn loại tài khoản:
   - **USD account** — spread thấp, khối lượng chuẩn (khuyến nghị vốn lớn hơn).
   - **Cent account** — vốn nhỏ, rủi ro thấp (bắt đầu từ $50 = 5.000 cent, mức nạp tối thiểu để kích hoạt license).
   - Link: `web.mygtc.app/login/register?ref=<mã ref>` (lấy trên trang `/tigold`).
2. **Xác nhận số tài khoản MT5** vừa mở (nhập vào ô verify ở `/tigold` — chỉ để mở link tải; license cấp qua bot ở bước 4).
3. **Tải về:** `Dralvo TiGold.ex5` + preset `Dralvo tigold v1.set` + file hướng dẫn (HTML).
4. **Kích hoạt license** qua Telegram (xem §6).

### 4.2 Mua VIP — qua Stripe
1. Đăng nhập / đăng ký (Supabase: email-password hoặc Google) tại `/login` · `/signup`.
2. Vào `/pricing` → chọn chu kỳ (1 tháng / 6 tháng / 1 năm) → **Checkout (Stripe)**.
3. Webhook Stripe tự **cấp license** → vào `/dashboard` xem trạng thái + tải `.ex5`/`.set` cả 3 EA (`/dashboard/kho`).
4. Nâng cấp từ TiGold → VIP: mua gói, **nhận license key mới**, thay vào input EA → chạy lại.

---

## 5. Cài đặt EA trên MT5

> Giao diện MT5 là tiếng Anh — giữ nguyên tên menu khi hướng dẫn khách.

1. **Chép EA vào MT5:** đóng MT5 → **File → Open Data Folder** → chép file `.ex5` vào `MQL5\Experts\` → mở lại MT5.
2. **Kéo EA lên chart:** **Navigator → Expert Advisors**, chuột phải **Refresh** → kéo EA lên chart **XAUUSD** đúng khung
   (TiGold: **M1**; GoldScalp: **M15**; GoldMaster: **D1**). Tab Common: tick **Allow Algo Trading**.
3. **Nạp preset:** tab **Inputs → Load** → chọn file `.set` tương ứng. Kiểm tra lot/risk phù hợp vốn → **OK**.
4. **Bật Auto Trading:** bấm nút **Algo Trading** trên toolbar (sáng xanh). Panel EA hiện lên = đang chạy.
5. **GoldMaster bắt buộc thêm whitelist WebRequest** (để pull CFTC API):
   **Tools → Options → Expert Advisors → Allow WebRequest** → thêm `https://www.dralvo.com`.
6. **VPS:** khuyến nghị để robot chạy **24/5** không gián đoạn. MT5 VPS hoặc VPS Windows thường đều OK (~$5–10/tháng).
   Gói VIP có kèm 1 VPS.

---

## 6. License — kích hoạt & quy tắc

- **Mỗi license gắn với MỘT số tài khoản MT5.** Không dùng chung nhiều tài khoản trên 1 license.
- **TiGold (free):** license **vĩnh viễn** — điều kiện: tài khoản THẬT qua IB GTC + nạp tối thiểu **$50 / 5.000 cent**. Kích hoạt qua bot:
  1. Mở Telegram, nhắn **@dralvo_bot** (hoặc bấm nút trên `/tigold`), gõ **"license"**.
  2. Bot hướng dẫn từng bước: xác nhận tài khoản → hướng dẫn nạp tối thiểu → khách xác nhận "đã nạp".
  3. Admin nhận nút duyệt 1-chạm (check GTC IB portal) → bấm Duyệt.
  4. Khách nhận license key + link tải ngay trong chat → nhập key vào EA → chạy.
- **VIP:** license cấp tự động sau thanh toán Stripe; xem ở `/dashboard`. Hết hạn khi gói hết hạn / hủy hết kỳ.
- **Kiểm tra hợp lệ:** hệ thống validate qua `/api/license/validate` (hợp lệ → pass; hết hạn → fail).
- **Đổi tài khoản MT5 / chuyển license:** không tự xử lý ở dashboard → đề nghị khách nhắn [@dralvoea](https://t.me/dralvoea).

---

## 7. Broker / IB — GTC

- **GTC là broker IB độc quyền của Dralvo** (`web.mygtc.app`). TiGold free **yêu cầu** mở tài khoản qua link IB GTC.
- GoldScalp / GoldMaster (VIP) **chạy được trên mọi broker MT5 có XAUUSD**, nhưng khuyến nghị GTC để đồng bộ hệ sinh thái.
- Có thể dùng **tài khoản demo** GTC để nhận EA miễn phí (xác nhận số tài khoản demo).
- Tài khoản: **USD** (spread thấp) hoặc **Cent** (vốn nhỏ).

---

## 8. Vốn tối thiểu & cấu hình rủi ro

| EA | Vốn gợi ý | Ghi chú |
|---|---|---|
| **TiGold** | Cent: test từ ~$10–50 · USD: **$5,000+** khuyến nghị | Dưới $5K trên USD, lot tối thiểu 0.01 của broker đẩy DD vượt 40%. Cent account để vốn nhỏ. |
| **GoldScalp** | **$500+** | Risk ~0.5%/lệnh để khởi đầu. |
| **GoldMaster** | **$1,000+** | Risk ~2%/lệnh để khởi đầu (matrix khuyến nghị 5% cho vốn lớn). |

- Khách tự chọn % risk theo khẩu vị; risk cao → return cao nhưng **DD cao hơn** (xem risk matrix §2).
- Công cụ **Risk Manager** (`/tools/calculator`) tính lot, R:R, prop firm — free cho mọi tier.

---

## 9. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân & cách xử lý |
|---|---|
| EA không vào lệnh | Chưa bật **Algo Trading** (nút toolbar + tick "Allow Algo Trading" trong EA). Kiểm tra license còn hạn. |
| GoldMaster báo lỗi API / không pull CFTC | Chưa thêm `https://www.dralvo.com` vào **WebRequest whitelist** (Tools → Options → Expert Advisors). |
| GoldMaster "0 lệnh" thời gian dài | **Bình thường** khi CFTC bearish (LONG-only → đứng ngoài bảo toàn vốn). Không phải lỗi. |
| Panel EA không hiện | EA chưa được kéo lên chart đúng symbol/khung, hoặc Algo Trading tắt. |
| License "invalid" | Số tài khoản MT5 không khớp license, hoặc license hết hạn. Verify lại số tài khoản; VIP kiểm tra `/dashboard`. |
| Tải EA bị khóa ở `/tigold` | Chưa hoàn tất Bước 1 (mở GTC) + Bước 2 (verify số tài khoản). |
| Robot dừng khi tắt máy | Cần **VPS** chạy 24/5. |
| Thanh toán không lên VIP | Webhook Stripe trễ; refresh `/dashboard`. Nếu vẫn không có sau ít phút → chuyển admin với email + mã giao dịch. |

---

## 10. FAQ tổng hợp (trả lời khách)

- **Cần kinh nghiệm trading không?** Không — robot tự động hoàn toàn, cài 1 lần. Khuyến nghị chạy **demo** trước khi vào tiền thật.
- **Cần gì để chạy?** MetaTrader 5 + tài khoản có XAUUSD (spread thấp) + nên có VPS.
- **Có Martingale / Grid không?** **Không.** Mỗi lệnh giới hạn rủi ro rõ ràng, không nhồi lệnh gồng lỗ.
- **Có cam kết lợi nhuận?** **Không** — và đừng tin ai cam kết. Số liệu là backtest quá khứ.
- **Backtest có chính xác không?** GoldMaster & TiGold độ chính xác cao (OHLC/tick thật). GoldScalp nên forward-test trước vì dùng cấu trúc giá phức tạp.
- **Chạy nhiều EA cùng lúc?** VIP cho tải cả 3; chạy mỗi EA trên chart/khung riêng, quản lý tổng rủi ro tài khoản.
- **Hủy được không?** Được, bất cứ lúc nào; gói vẫn chạy hết kỳ đã trả.
- **Khác nhau giữa 3 robot?** GoldMaster = swing D1 kiên nhẫn (LONG); GoldScalp = M15 nhịp nhanh trong ngày; TiGold = adaptive miễn phí. VIP chạy cả ba.

---

## 11. Quy tắc giao tiếp cho Agent (BẮT BUỘC)

**Tông giọng:** chuyên nghiệp, minh bạch, dựa trên dữ liệu, không hype. Tự tin nhưng không kiêu.

**KHÔNG ĐƯỢC:**
- ❌ Hứa/ám chỉ lợi nhuận chắc chắn, "x% mỗi tháng", "không thua", "làm giàu nhanh".
- ❌ Khuyên cụ thể nên vào/thoát lệnh, đòn bẩy, hay coi đây là **lời khuyên tài chính**.
- ❌ Bịa số liệu. Chỉ dùng số trong §2 (nguồn: `backtest-stats.ts`).
- ❌ Tự hứa hoàn tiền hay ngoại lệ chính sách.
- ❌ Nhắc VietQR/Sepay (đã gỡ) hay tier "Unlimited" (giờ gọi "VIP" với khách).

**PHẢI:**
- ✅ Luôn kèm bối cảnh rủi ro khi nói số: *"Đây là kết quả backtest trên dữ liệu quá khứ, không bảo đảm tương lai."*
- ✅ Với TiGold: nói rõ chỉ có **6 tháng dữ liệu, edge mỏng**.
- ✅ Khuyến nghị **demo trước** cho người mới.
- ✅ Chuyển các việc cần quyền admin (cấp/đổi license, refund, lỗi thanh toán) tới **[@dralvoea](https://t.me/dralvoea)**.

**Câu disclaimer chuẩn (chèn khi bàn hiệu suất):**
> "Dralvo cung cấp công cụ giao dịch, không phải lời khuyên tài chính. Số liệu là kết quả
> kiểm chứng trên dữ liệu lịch sử; hiệu suất quá khứ không bảo đảm kết quả tương lai.
> Giao dịch XAUUSD/đòn bẩy có rủi ro mất vốn."

---

## 12. Liên hệ & Leo thang (Escalation)

| Việc | Kênh |
|---|---|
| Hỗ trợ chung, cấp/kích hoạt license, đổi tài khoản, lỗi thanh toán | Telegram **[@dralvoea](https://t.me/dralvoea)** |
| Quyền riêng tư / dữ liệu cá nhân / pháp lý | **legal@dralvo.com** |
| Quản lý gói & hủy | Billing portal trong `/dashboard/settings` |
| Cộng đồng | Telegram Community (Free) · Telegram VIP (gói VIP) |
| Website | **dralvo.com** |

**Khi nào leo thang ngay:** yêu cầu hoàn tiền · tranh chấp thanh toán · cấp lại / chuyển license ·
nghi gian lận IB · khiếu nại pháp lý · bug hệ thống không giải quyết được bằng các bước §9.

---

## 13. Tham chiếu nội bộ (cho người duy trì KB)

- Số liệu EA: `src/lib/backtest-stats.ts` *(nguồn sự thật)*
- Copy landing + FAQ (8 ngôn ngữ): `src/lib/landing-copy.ts`
- Flow TiGold + hướng dẫn cài đặt: `src/lib/tigold-copy.ts`, `src/app/tigold/page.tsx`
- Giá & chu kỳ: `src/app/pricing/page.tsx` · Logic gói/tier: `src/lib/plan.ts`
- Điều khoản (billing/cancel/refund): `src/lib/i18n.ts` (mục Terms)
- Plan sản phẩm tổng thể: [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md) · Bản đồ tài liệu: [`README.md`](./README.md)
- EA & sales chi tiết: `../../dralvo-trading/docs/sales-marketing.md`

> Khi cập nhật KB này: kiểm tra lại số liệu từ `backtest-stats.ts` và giá từ `pricing/page.tsx` trước.
