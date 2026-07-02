# Dralvo — RUNBOOK bàn giao session

> Tài liệu bàn giao để chuyển sang session mới. Đọc hết phần **TL;DR** + **Cạm bẫy** trước khi sửa bất cứ gì.

---

## 0. TL;DR — cách tiếp tục

- **Repo**: `E:\Dralvo\dralvo-landing` (Next.js 16.2.7 + Turbopack, Tailwind, TypeScript, Supabase, Stripe).
- **Dev server**: chạy ở **cổng 3100** (`npm run dev` → `next dev -p 3100`; cổng 3000 dành cho backtest). URL: http://localhost:3100
- **Verify mọi thay đổi**:
  ```bash
  npx tsc --noEmit 2>&1 | grep -E "error TS" | grep -vE "thesis-history.test.ts|\.next/types/"   # phải rỗng
  npx eslint --max-warnings=0 <file đã sửa>
  ```
  - Lỗi TS **có sẵn (bỏ qua)**: `thesis-history.test.ts` (thiếu `tradeSimulation`) và mọi lỗi `.next/types/`.
- **Test/CI**: `npx vitest run` — có **4 ca webhook đỏ CÓ SẴN** (`src/app/api/stripe/webhook/route.test.ts` — mock `db` thiếu `.select/.upsert`). Không phải lỗi mới.
- **DB**: Supabase đã link (ref `qmgeomiidtuycbfikqte`). Lịch sử migration **bị lỗi** → xem mục 6.
- **Tài khoản test**:
  - `dinhhuan94@gmail.com` (`a67634fa-6596-4889-9ad9-7a7dbb80429a`) — **VIP lifetime comp** (3 license per-EA, `is_lifetime=true`, `expires_at=null`).
  - `macao0237@gmail.com` (`55a63241-9f32-4a4e-a647-13f489c6a0b2`) — **Stripe test subscriber** (3 license rental, hết hạn 2026-07-29).

---

## 1. ⚠️ CẠM BẪY QUAN TRỌNG (đọc kỹ)

### 1.1. `is_lifetime` **liên tục bị mất** (đã xảy ra 3 lần)
Logic phân quyền VIP phụ thuộc cột `is_lifetime`. Một thao tác nào đó (git revert/checkout, hoặc chat song song) **cứ ghi đè làm mất** nó. Nếu VIP bỗng hiển thị **Free**, kiểm tra 2 chỗ:
- `src/lib/plan.ts` → `resolvePlan()`: `licenseValid` PHẢI là
  ```ts
  license.plan === "unlimited" && (license.is_lifetime === true || (!!license.expires_at && new Date(license.expires_at) > now))
  ```
  (KHÔNG được quay về `!license.expires_at || ...` — đó là bản cũ làm null=vĩnh viễn = lỗ hổng free-trọn-đời).
- `src/lib/subscription-gate.ts` → `LICENSE_SELECT` PHẢI gồm `is_lifetime`: `"plan, expires_at, is_lifetime"`.
- Nên thêm/giữ unit test ở `src/lib/plan.test.ts` chốt: lifetime key (`expires_at=null, is_lifetime=true`) → `Unlimited`.

### 1.2. RLS trên `license_keys`
Bảng `license_keys` bật RLS, **không có policy đọc cho role `authenticated`** → dashboard đọc bằng session user sẽ rỗng. **Phải đọc qua admin client (service-role) đã-scope theo `user.id`** — đây là lý do `getPlanDetailsByUserId` (subscription-gate) và `page.tsx` dùng `getSupabaseAdminClient()`. Đừng đổi sang đọc bằng cookie client.

### 1.3. Lịch sử migration Supabase bị lệch
`npx supabase db push` **FAIL** ở `20260628100000_license_keys.sql` vì nó tạo unique index trên `user_id`, nhưng model per-EA giờ cho **nhiều key/1 user** (trùng `user_id`). Cách áp migration mới: xem **mục 6**.

### 1.4. Nhiều file bị sửa ngoài luồng giữa các lượt
Các file hay bị chat khác / linter / user sửa: `src/app/api/license/validate/route.ts`, `src/components/dashboard/ea-logo.tsx`, `src/lib/plan.test.ts`, `src/app/admin/notifications/page.tsx`, `src/components/admin/system-notifications-manager.tsx`. **Luôn Read lại trước khi Edit.**

### 1.5. Middleware = `src/proxy.ts`
Next.js 16 đổi tên `middleware.ts` → **`proxy.ts`**. Sửa middleware là sửa file này. Thay đổi middleware **không hot-reload** — phải restart dev server.

---

## 2. Mô hình nghiệp vụ cốt lõi

### 2.1. Gói: chỉ còn **Free** và **VIP**
- "Pro" đã bỏ. Tier nội bộ là `"Free" | "Unlimited"` (`PlanTier`), **nhãn hiển thị = "VIP"** (`PAID_PLAN_LABEL`, `planDisplayName()` trong `src/lib/plan.ts`).
- Định danh nội bộ giữ nguyên `"unlimited"` (DB `license_keys.plan`, biến `STRIPE_PRICE_UNLIMITED_*`). **Chỉ đổi chữ hiển thị** sang VIP, không đụng DB/Stripe id.
- `isPaidTier(tier)` = `tier === "Unlimited"`. Dùng helper này thay vì so sánh chuỗi rải rác.

### 2.2. Nguồn paid access (theo thứ tự, trong `resolvePlan`)
1. `license_keys` plan `unlimited` hợp lệ (lifetime hoặc còn hạn) → VIP, `planSource: "license"`.
2. Subscription Stripe active/trialing → VIP, `planSource: "subscription"` (chỉ khi có `stripe_subscription_id`).
3. Sub **không-Stripe** (VietQR/manual) → VIP chỉ khi `current_period_end` chưa quá hạn (chống "trả 1 lần dùng mãi").
- 1 hàm nguồn-sự-thật: `getPlanDetailsByUserId(userId)` (admin client) ← dùng bởi `getDashboardPlan()` (layout/pages) và `getUserPlanTierByUserId()` (API enforcement).

### 2.3. Per-EA licenses
- `license_keys` có cột **`product`** (`goldmaster|goldscalp|tigold`), unique `(user_id, product)`. 1 user tối đa 1 key/EA.
- **VIP = 3 key** (goldmaster, goldscalp, tigold), tạo bởi Stripe webhook (`checkout.session.completed`). `max_accounts`: goldmaster/goldscalp=2, tigold=1.
- `key` (uuid) là cái EA gửi lên để validate.

### 2.4. Chống share (anti-share)
- Bảng **`license_devices`** `(license_id, mt5_account, first_seen, last_seen)`, cap = `license_keys.max_accounts` (mặc định 2). TOFU: N account đầu tự ghi danh; account thứ N+1 bị `account_limit`.
- Validate route: `src/app/api/license/validate/route.ts` — `GET ?key=&account=&product=`. Yêu cầu EA gửi **`product`** + **`account`**.
- User tự quản account: `src/app/api/user/license-devices/route.ts` (GET/POST/PATCH/DELETE) → UI trong `ea-card.tsx`.
- **Việc EA còn lại**: `.mq5` phải gửi `&account=AccountInfoInteger(ACCOUNT_LOGIN)` + `&product=<ea>`, và xử lý reason mới (`account_limit`, `account_required`, `product_mismatch`). Cần recompile `.ex5`.
- **`mt5_account` (khóa IB single-account) vs `max_accounts` (cap multi-account)** — quy tắc: `mt5_account` trên row CHỈ khóa cứng 1 account khi `max_accounts <= 1`. Nếu `max_accounts > 1`, `max_accounts` là nguồn-sự-thật, bind qua `license_devices` kể cả khi row còn `mt5_account` (sửa 2026-06-30). Trước đây bất kỳ key nào có `mt5_account` đều bị khóa về 1 account → admin chỉnh max acc bị no-op âm thầm (bug đã gặp ở tigold dinhhuan94: max=3 nhưng dashboard hiện 1).
  - Helper `reconcilePreboundLock()` ([license-binding.ts](../src/lib/license-binding.ts)): khi key thành multi-account mà còn `mt5_account`, tự đẩy account đó vào `license_devices` + xóa pin. Được gọi sau mọi lần admin sửa max (`admin/users:set_max_accounts`, `admin/licenses:update/create`).
  - Đã normalize data 1 lần: tigold dinhhuan94 (`6511271`) chuyển vào `license_devices`, `mt5_account=null`, `max_accounts=3`.

### 2.5. Rental vs lifetime (Stripe)
- `src/lib/stripe-subscriptions.ts`: `subscriptionPeriodEndIso(sub)` đọc `current_period_end` từ **subscription item** (Stripe API basil+ đã dời khỏi root) + fallback `periodEndFromPlan(period)`. **Không bao giờ** để license rental có `expires_at=null`.
- `is_lifetime=true` CHỈ cho comp admin cấp tay (như dinhhuan94). License mua qua Stripe = rental (`is_lifetime=false`, có `expires_at`).

---

## 3. Đã làm trong session này (kèm file)

| Mảng | Mô tả | File chính |
|---|---|---|
| Plan/VIP | Bỏ Pro, unify resolve, "Unlimited"→"VIP" hiển thị | `src/lib/plan.ts`, `subscription-gate.ts`, `get-dashboard-plan.ts` |
| RLS fix | Dashboard đọc plan/license qua admin client | `get-dashboard-plan.ts`, `app/dashboard/page.tsx` |
| Stripe rental | period end từ item + fallback; is_lifetime tách comp | `stripe-subscriptions.ts`, webhook |
| Webhook | Tạo 3 license per-EA khi mua VIP + **check lỗi + throw** (hardening) | `app/api/stripe/webhook/route.ts` |
| Anti-share | license_devices + cap + validate + quản account | `lib/license-devices.ts`, `api/license/validate`, `api/user/license-devices` |
| Dashboard home | Card EA mới + logo SVG + copy key + quản account + CFTC | `components/dashboard/ea-card.tsx`, `ea-logo.tsx`, `cftc-status-card.tsx`, `app/dashboard/page.tsx` |
| Ticker | Thanh chạy ngang dưới header (status + system notif) | `components/dashboard/notification-ticker.tsx` (render trong `dashboard-shell.tsx`) |
| Chuông + hộp thư | Bell dropdown + trang `/dashboard/notifications` | `notifications-bell.tsx`, `notifications-inbox.tsx`, `app/dashboard/notifications/page.tsx` |
| Thông báo hệ thống | Bảng + API user/admin + UI admin | `lib/system-notifications.ts`, `api/user/notifications/*`, `api/admin/system-notifications`, `components/admin/system-notifications-manager.tsx` |
| Cài đặt thông báo | Chỉ In-app + Email (bỏ Telegram + run logs), auto-save | `notification-preferences.tsx`, `api/user/preferences` (có GET) |
| Billing | Hiển thị gói/loại/ngày kích hoạt/hết hạn + portal Stripe | `api/user/billing`, `components/dashboard/billing-panel.tsx` |
| Light mode | Tông Binance (trắng/xám + vàng), shadow `.card-elevate`, viền đậm, chữ #1E2329, gold text đậm | `app/globals.css` |
| Đồng hồ | Theo múi giờ thiết bị user (bỏ UTC cứng) | `dashboard-shell.tsx` |
| Chat | Nút Telegram nổi → `t.me/dralvo_bot` (env `NEXT_PUBLIC_TELEGRAM_SUPPORT_URL`) | `components/shared/telegram-chat-button.tsx`, `app/layout.tsx` |
| Bỏ v1 | `/dashboard/alerts` → redirect `/dashboard` | `app/dashboard/alerts/page.tsx` |
| Nav | Thêm "Thông báo" vào sidebar | `sidebar-nav.tsx`, `lib/i18n.ts` (nav.notifications) |

---

## 4. Việc CÒN DANG DỞ / TODO

- [ ] **Áp migration** lên DB (xem mục 6): `20260628120000_license_lifetime`, `20260628140000_license_devices`, `20260630120000_system_notifications` (cái này đã chạy qua SQL Editor — xác nhận lại), **`20260630160000_affiliate_payouts`** (MỚI — bảng yêu cầu rút tiền affiliate; chưa áp thì nút "Request payout" trả lỗi nhẹ, không crash). Nếu deploy code mà chưa áp → app rơi về Free / lỗi cột.
- [ ] **Sửa EA `.mq5`** gửi `&account=` + `&product=` (mục 2.4). Chưa làm — là mảnh cuối để anti-share + per-EA hoạt động với khách thật.
- [ ] **Stripe test mode**: chỉ đổi env local (`sk_test_`, price test, webhook secret test) — KHÔNG đụng env live production. Webhook local: `stripe listen --forward-to localhost:3100/api/stripe/webhook`. (Trước đó forward về 3001 — nhớ đổi sang 3100.)
- [ ] **4 webhook test đỏ** — viết lại mock `db` (`route.test.ts`) cho CI xanh (chưa làm).
- [x] ~~**`AlertsPage`** trong `components/dashboard/dashboard-pages.tsx` giờ là code chết (route alerts đã redirect) — có thể dọn.~~ **Đã dọn** (2026-06-30): xóa hàm `AlertsPage` + 2 import thừa (`AlertList`, `AlertNotifications`). Hai component đó vẫn được giữ vì còn dùng trong `dashboard-page-client.tsx`. Route `alerts/page.tsx` vẫn redirect như cũ.
- [ ] Cân nhắc **heartbeat chống chạy song song** cho anti-share (dữ liệu `last_seen` đã có).
- [ ] `vietqr/confirm` cấp cứng 30 ngày + **không tạo license_keys** → khách VietQR chưa có key chạy EA (nếu còn dùng VietQR).

---

## 5. Test affiliate request rút tiền
- **Nút "Request payout" giờ ĐÃ hoạt động** (full flow, làm 2026-06-30): user gửi yêu cầu → bảng `affiliate_payouts` → admin duyệt/đánh dấu đã trả ở tab **Payouts** (`/admin` → Affiliate → Payouts).
  - User API: `POST/GET /api/affiliate/payout` (kiểm tra: affiliate `active`, available ≥ `min_payout`, không có yêu cầu đang mở — unique partial index chặn trùng).
  - Đánh dấu "đã trả" ở admin → settle: flip mọi commission `pending` → `paid` + cộng `paid_out` (`settlePayoutAsPaid` trong server.ts).
  - **Cần áp migration `20260630160000_affiliate_payouts` trước** (mục 4/6) — bảng này **đã được áp** (có 1 row test). Nếu DB mới chưa áp → nút trả lỗi nhẹ chứ không crash.
  - **Thông tin nhận tiền (Option A, thủ công — 2026-07-01)**: form request thu thập đích nhận tiền, lưu JSON vào cột `affiliate_payouts.method` (KHÔNG cần migration thêm). 2 loại: **VN bank** (ngân hàng từ danh sách + STK 6–19 số + chủ TK) | **USDT** (chọn network TRC20/BEP20/ERC20/Solana/Polygon + địa chỉ ví, validate regex theo network). Định nghĩa + validate + format ở [payout-options.ts](../src/lib/affiliate/payout-options.ts). Admin xem cột "Nhận tiền" trong tab Payouts để chuyển tiền tay.
  - **Chuyển tiền là THỦ CÔNG / ngoài hệ thống** — "Mark paid" chỉ ghi sổ, không có Stripe Connect/bank API. Admin tự chuyển khoản/USDT rồi bấm Mark paid.
  - Row test cũ có `method=null` → admin hiển thị "—", không lỗi.
- Số dư khả dụng = Σ `affiliate_commissions` có `status='pending'` ([server.ts](../src/lib/affiliate/server.ts) `getAffiliateStats`). Ngưỡng = `affiliate_settings.min_payout` (mặc định $50).
- Bơm số dư test (SQL Editor):
  ```sql
  insert into public.affiliate_commissions (affiliate_id, amount, status)
  select a.id, 100, 'pending' from public.affiliates a
  join auth.users u on u.id = a.user_id where u.email = 'email@example.com';
  ```
- Hoặc hạ ngưỡng: `update public.affiliate_settings set min_payout = 1 where id = 1;`

---

## 6. Áp migration (DB) — CÁCH HIỆN TẠI

`db push` đang fail (mục 1.3). Hai lối:

**A. Nhanh — Supabase SQL Editor** (khuyến nghị cho từng migration mới): mở file `.sql` trong `supabase/migrations/`, copy nội dung, dán vào SQL Editor → Run. (Migration dùng `create ... if not exists` nên an toàn.)

**B. Sửa lịch sử để CLI dùng được**: đánh dấu các migration cũ là đã-áp rồi push:
```bash
npx supabase login
npx supabase migration repair --status applied 20260615154500 20260616183000 20260628100000 20260628120000 20260628140000 20260628150000 20260628210000 20260628220000 20260628230000 20260629000000 20260629020000 20260629030000
npx supabase db push   # giờ chỉ áp cái mới
```

---

## 7. Cấp / thu hồi VIP thủ công (comp)
```sql
-- Cấp VIP lifetime (3 EA) cho 1 user — chạy SQL Editor, đổi email
insert into public.license_keys (user_id, product, plan, is_lifetime, expires_at, max_accounts)
select u.id, p.product, 'unlimited', true, null, p.max_accounts
from auth.users u
cross join (values ('goldmaster',2),('goldscalp',2),('tigold',1)) as p(product, max_accounts)
where u.email = 'email@example.com'
on conflict (user_id, product) do update set plan='unlimited', is_lifetime=true, expires_at=null;
```
(Lưu ý: bản gốc dùng script service-role; SQL trên là bản tương đương trực tiếp.)

---

## 8. Bản đồ file nhanh
- Plan/quyền: `src/lib/plan.ts`, `src/lib/subscription-gate.ts`, `src/app/dashboard/get-dashboard-plan.ts`
- Stripe: `src/lib/stripe-subscriptions.ts`, `src/lib/stripe.ts`, `src/app/api/stripe/{webhook,checkout,portal}/route.ts`
- License/anti-share: `src/lib/license-devices.ts`, `src/app/api/license/validate/route.ts`, `src/app/api/user/license-devices/route.ts`
- Thông báo: `src/components/dashboard/{notifications-bell,notification-ticker,notifications-inbox}.tsx`, `src/lib/system-notifications.ts`, `src/app/api/user/notifications/*`, `src/app/api/admin/system-notifications/route.ts`
- Dashboard: `src/app/dashboard/page.tsx`, `src/components/dashboard/{dashboard-shell,sidebar-nav,ea-card,ea-logo,billing-panel,notification-preferences,cftc-status-card}.tsx`
- Admin auth: `src/lib/admin/auth.ts` (`getAdmin()` role-based; KHÁC `isAdminEmail`)
- Middleware: `src/proxy.ts`
- Theme: `src/app/globals.css` (dark `:root`, light `[data-theme="light"]`)
- Migrations: `supabase/migrations/`

---

## 9. Env Stripe (cho test mode)
Đọc bởi code: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_UNLIMITED_{MONTHLY,SIXMO,YEARLY}`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` (chỉ launch-readiness). Mode (test/live) do tiền tố key quyết định, code không cần đổi. `apiVersion` hardcode `2026-05-27.dahlia` (dùng chung 2 mode).
