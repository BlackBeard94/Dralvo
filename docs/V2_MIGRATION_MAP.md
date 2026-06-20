# Dralvo V2 — Bản đồ Migration Codebase (giữ / sửa / xóa / mới)

> Đối chiếu từng module thực tế trong repo với nhu cầu V2 (xem
> [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md)). Đây là bản chi tiết hóa mục FILE MAP
> của plan, đã verify với code ngày 2026-06-17.
>
> **Quy ước:** ✅ KEEP (dùng lại) · 🔶 MODIFY (sửa/repurpose) · ❌ DELETE/ARCHIVE
> (V1, không còn dùng) · 🆕 NEW (V2 cần tạo)
>
> **Nguyên tắc an toàn:** không xóa thẳng — di chuyển vào `archive/` hoặc xóa
> trong 1 commit riêng, sau khi đã có thay thế V2. Verify `npm run build` +
> `npm run test` sau mỗi nhóm.

---

## 1. Tài sản lõi (moat) — GIỮ NGUYÊN

| Path | Loại | Lý do |
|------|------|-------|
| `src/data/ingestion/**` | ✅ | Pipeline CFTC/COMEX/GLD/TIPS/XAUUSD — nuôi cả backtest lẫn signal. Moat. |
| `src/data/driver-registry.ts` | ✅ | Định nghĩa driver — dùng cho signal driver-check. |
| `src/data/indicators.ts` | ✅ | Types OHLC/indicator, dùng bởi `/api/xauusd`. |
| `src/lib/supabase/**` | ✅ | Client server/admin/auth. |
| `src/lib/{utils,i18n,rate-limit,run-logs,admin,api-auth,product-analytics}.ts` | ✅ | Hạ tầng dùng chung. |
| `src/lib/monitoring/**` | ✅ | Freshness + source-alerts cho pipeline. |
| `src/lib/notifications/**` | ✅ | dispatch/email/telegram — **repurpose để push tín hiệu V2**. |
| `src/lib/{stripe,stripe-subscriptions,subscription-gate,sepay,vietqr}.ts` | ✅ | Billing cho Indicator PRO / Bot EA / khóa học. |
| `src/app/api/{stripe,sepay,vietqr}/**` | ✅ | Cổng thanh toán. |
| `src/app/api/ingest/**` | ✅ | Cron ingest pipeline. |
| `src/app/api/ops/**` | ✅ | Endpoint admin (ops). |
| `src/app/api/{health,analytics/events,waitlist}/**` | ✅ | Hạ tầng/marketing. |
| `src/app/api/{xauusd,cftc-status,drivers/history,indicators}/**` | ✅ | Data endpoints — feed landing + signal. |
| `src/app/api/user/preferences/**` | ✅ | Preferences người dùng. |
| `src/app/{login,signup,reset-password,auth/callback}/**` | ✅ | Auth (plan: giữ, simplify). |
| `src/app/{privacy,terms,disclaimer}/**` | ✅ | Legal. |
| `src/components/{shared,marketing,ui}/**` | ✅ | UI dùng chung + marketing + primitives. |
| `supabase/migrations/**`, `supabase/schema.sql` | ✅ | Giữ lịch sử migration. |
| `tailwind.config.ts`, design system | ✅ | Thương hiệu Dralvo. |

> ✅ **Đã xử lý (2026-06-17):** tài sản lõi (MT5 EA + data backtest H1/H4) đã
> được tách sang repo riêng **`E:\Dralvo\dralvo-trading`** (git init + commit,
> local private). Trước đây chúng untracked/gitignored trong `dralvo-landing`.
> Backtest engine vẫn chưa tồn tại — sẽ đặt tại `dralvo-trading/backtest/`.
> `scripts/fetch_cftc.py` được GIỮ trong `dralvo-landing/scripts/` (script ops
> gắn với `/api/cftc-status`, đã track git).

---

## 2. Sửa / Repurpose

| Path | Loại | Việc cần làm |
|------|------|--------------|
| `src/app/page.tsx` | 🔶 | Landing V2: hero "trade data thật", bảng backtest, sản phẩm, track record. (Đang sửa dở.) |
| `src/app/pricing/page.tsx` | 🔶 | Pricing Indicator PRO $99 / Bot EA $299 / khóa học. (Đang sửa dở.) |
| `src/lib/i18n.ts` | 🔶 | Copy mới cho landing/pricing V2 (vi/en/pt-BR). |
| `src/app/api/telegram/{connect,webhook}/**` | 🔶 | Repurpose từ alert V1 sang **hub bot V2** (`/signal`, `/performance`, `/indicator`, `/ib`, `/vip`). |
| `src/lib/alerts.ts` + `src/app/api/alerts/**` | 🔶 | Repurpose từ "evidence-threshold alert" sang "signal fired → push". HOẶC xóa nếu V2 push trực tiếp từ signal engine. **Cần quyết định.** |
| `src/app/api/alerts/evaluate/**` | 🔶 | Cron đánh giá → có thể thành cron "tính signal hiện tại + push". |
| `src/lib/{driver-history,indicator-values,launch-readiness}.ts` | 🔶 | Có thể feed signal/landing; giữ tạm, review khi build signal API. |

---

## 3. Xóa / Archive (V1 dashboard product)

| Path | Loại | Ghi chú |
|------|------|---------|
| `src/app/dashboard/**` (8 trang) | ❌ | Toàn bộ dashboard V1. Plan: bỏ, redirect `/dashboard → /`. |
| `src/app/dashboard-redesign-preview/page.tsx` | ❌ | Preview tạm. |
| `src/app/methodology/**` | ❌ | Methodology thesis V1. |
| `src/components/dashboard/**` (25 file) | ❌ | UI dashboard V1. *Cân nhắc cứu* `xauusd-chart.tsx`, `market-header.tsx` cho landing/analysis trước khi xóa. |
| `src/lib/intelligence/**` | ❌ | Thesis engine: `gold-thesis`, `ai-signal`, `thesis-history`, `replay`, `localize-thesis` (+ tests). Plan liệt kê xóa. |
| `src/app/api/thesis/**` | ❌ | today/history/replay/ai-signal. |
| `src/app/api/export/csv/**` | ❌ | Export evidence ledger V1. |
| `src/app/api/user/ai-credentials/**` + `src/lib/ai-credentials.ts` | ❌ | Gắn với ai-signal V1 (user-BYO-key). |

> 🐛 **Lợi ích phụ:** xóa `src/lib/intelligence/thesis-history.test.ts` sẽ giải
> quyết luôn lỗi `tsc` đang chặn typecheck (thiếu field `tradeSimulation`).

---

## 4. Tạo mới (V2)

| Path | Loại | Mô tả |
|------|------|-------|
| `src/app/api/signal/current/route.ts` | 🆕 | **Mảnh ghép chặn nhiều thứ nhất.** Trả signal bullish/bearish/neutral + driver-check + backtest stats. EA/indicator/Telegram đều cần. |
| `src/app/api/license/validate/route.ts` | 🆕 | Validate license cho Indicator PRO / Bot EA (bind MT5 account). |
| `supabase/migrations/<ts>_license_keys.sql` | 🆕 | Bảng `license_keys`. |
| `src/app/analysis/page.tsx` + `[slug]/page.tsx` | 🆕 | Phân tích vàng hàng ngày (SEO + dẫn Telegram). |
| `scripts/backtest/**` → tracked | 🆕 | Đưa engine vào version control. |
| `mt5-indicators/`, `mt5-ea/`, `tradingview-indicators/`, `telegram-bot/` | 🆕 | Artifacts sibling (plan đề xuất; hiện chưa tạo, EA đang nằm tạm `scripts/`). |

---

## 5. Thứ tự thực thi đề xuất (an toàn build)

1. ✅ **Bảo vệ tài sản lõi (XONG):** MT5 EA + data đã tách sang repo riêng
   `E:\Dralvo\dralvo-trading`. (Còn lại: đẩy lên private remote để backup off-machine.)
2. **Tạo Signal API** (`/api/signal/current`) từ pipeline có sẵn — unblock EA,
   indicator, Telegram, landing.
3. **Sửa landing + pricing + i18n** (phần 2) để mặt tiền khớp V2.
4. **FX Backtest Tool** (`/api/backtest` + `/tools/backtest`) — free, kéo traffic.
   Port từ `dralvo-trading/backtest/` + dataset FX. Xem `PRODUCT_PLAN.md §3.6`.
5. **License system** (migration `license_keys` + `/api/license/validate`) cho **2 EA
   bán** (GoldMaster, Gold Scalp — `PRODUCT_PLAN.md §3.5`): bind MT5 account, Stripe
   webhook cấp license. GoldMaster reuse WebRequest sẵn có; Gold Scalp cần THÊM WebRequest.
6. **Gỡ V1** (phần 3) trong commit riêng, sau khi V2 thay thế đã chạy:
   redirect `/dashboard → /`, xóa intelligence + thesis API + dashboard UI.
   Verify `npm run build && npm run test` sạch (typecheck cũng hết lỗi).
7. **Trang `/analysis`** + Telegram hub bot + trang sản phẩm từng EA.

> Mỗi bước là một PR/commit độc lập, verify build+test trước khi sang bước sau.
