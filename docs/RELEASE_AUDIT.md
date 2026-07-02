# Dralvo — Pre-Release Audit (2026-07-01)

> Audit toàn diện trước release: build/test, backend/security, payment/licensing,
> frontend/performance, database. Thực hiện bằng 4 agent chuyên biệt (song song) +
> kiểm tra deterministic trung tâm + xác minh trực tiếp trên LIVE DB.
> **Verdict tổng: 🔴 CHƯA SẴN SÀNG RELEASE** — có blocker về bảo mật + tiền + funnel.

Nhãn độ tin cậy: **[CONFIRMED]** = đã đọc code / test live tận nơi · **[PLAUSIBLE]** = agent trích dẫn line, chưa tự chạy lại.

---

## ✅ ĐÃ SỬA (2026-07-01, đợt 1 — code, verified: tsc sạch · eslint 0 · 164/164 test pass)
- **B1** — 2 route admin affiliate (`payout`, `settings`) chuyển sang `getAdmin()`+`can(affiliate.manage)`, bỏ nhánh fail-open. Fail-closed.
- **B2** — `ib/verify`: rate-limit (10/phút/IP) + null-check admin client + select-then-insert (bỏ `onConflict` gây 42P10) + xử lý error thật (hết nuốt lỗi). *Còn lại: validator vẫn mock — cần API broker GTC thật để chống farm license (chưa có API → không sửa được ở code).*
- **B3** — webhook `subscription.updated`: chỉ gia hạn license khi `hasProAccess(status)`, `past_due/unpaid` → expire ngay; scope `is_lifetime=false` để không đụng comp. `deleted` cũng scope rental.
- **H2** — `getPlanDetailsByUserId` resolve trên TẤT CẢ key unlimited (bỏ `nullsFirst`+limit(1)).
- **H3** — chặn self-referral trong `recordAffiliateCommission`.
- **H4 (phần tiền)** — ép idempotency key non-null; bỏ đường ghi commission trùng ở `checkout.session.completed` (chỉ `invoice.payment_succeeded` ghi).
- **H5 + M5** — `settlePayoutAsPaid` chỉ settle commission `created_at ≤ requested_at` (đúng snapshot đã duyệt), chặn re-settle payout đã xử lý, hết double-count `paid_out`.
- **H6** — telegram webhook fail-closed khi thiếu secret.
- **Test** — sửa 4 ca đỏ (mock webhook chainable + assert `oid` ở checkout/success). CI xanh.

## ✅ ĐÃ SỬA (đợt 2 — 2026-07-01)
- **M2** — reconcile toàn bộ counter affiliate từ nguồn (áp thẳng LIVE DB qua service-role). **0 balance âm còn lại.**
- **M4** — webhook thêm `charge.refunded` → hủy commission còn `pending` + trừ `total_earned` (đã-paid thì log để clawback tay).
- **M5/M6** — `mark_paid` admin chỉ settle commission `pending` (hết double-count); mọi action admin (`approve/reject/suspend/mark_paid/reject_payout`) trả **404 khi 0 row** thay vì success giả.
- **H4-full (code)** — webhook thêm guard `stripe_events` (dedup toàn event; best-effort, tự no-op nếu bảng chưa có).
- **Frontend** — no-flash theme script + font preconnect (layout), bỏ Playfair (tải thừa), sửa `.claude/launch.json` port 3000→3100. Verify landing chạy 200 với head mới.

## 📄 SQL DDL đã soạn sẵn (chạy qua Supabase SQL Editor — tôi KHÔNG có DB password để tự áp)
File: [`supabase/migrations/20260701130000_release_audit_ddl.sql`](../supabase/migrations/20260701130000_release_audit_ddl.sql) — gồm **H1** (siết RLS evidence/thesis/corrections theo paid), **B2b** (index `mt5_account`→UNIQUE), **H4** (bảng `stripe_events`). Idempotent, chạy lại an toàn.

## ✅ ĐÃ SỬA (đợt 3 — 2026-07-01, có DB password → áp thẳng DDL)
- **H1 (đóng hẳn, verify live)** — DDL siết RLS đã áp trên prod (bạn chạy file + tôi verify): giả lập JWT → **paid user đọc 4065/20 dòng, free user 0/0**. `dralvo_is_paid_user()` + policy "Paid users…" trên evidence/thesis/corrections. Index `mt5_account`→UNIQUE + bảng `stripe_events` cũng đã có.
- **M3 (core)** — sinh DDL chuẩn `subscriptions`/`profiles` từ schema live → viết [`20260612000000_subscriptions_profiles_baseline.sql`](../supabase/migrations/20260612000000_subscriptions_profiles_baseline.sql) (kèm RLS policy). Validate = chạy trong transaction rollback OK, no-op trên prod. Rebuild staging/DR không còn thiếu 2 bảng này.
- **Fix trùng timestamp migration** `20260630160000` (affiliate_payouts + tracking_settings) → đổi tracking_settings thành `20260630170000` (db push không còn kẹt duplicate).
- **Frontend B1** — 4 route V1 `/dashboard/{chart,correlation,drivers,replay}` → redirect `/dashboard` (component giữ nguyên, đảo ngược được).
- **Frontend B2** — `NotificationsProvider` mới: bell + ticker dùng chung 1 poll (giảm 50% request), tạm dừng khi tab ẩn (`visibilitychange`).
- **Frontend B4 (an toàn)** — chuyển font từ CSS `@import` (render-blocking) → `<link rel=stylesheet>` trong `<head>` + preconnect; giữ nguyên tên font nên không đổi giao diện. Verify landing 200 + head có link.

## ✅ ĐÃ SỬA (đợt 4 — migration drift xử lý trọn)
- **Khôi phục 2 file migration mất** — lấy SQL gốc từ `supabase_migrations.schema_migrations` (không cần GitHub): `20260629000000_admin_notifications`, `20260629030000_notification_settings`. Viết lại đúng nội dung đã áp.
- **`notification_settings` recorded-applied nhưng THIẾU bảng trên prod** — đã tạo bảng + seed 5 dòng (giờ khớp với record). (`vps_assignments` cũng thiếu nhưng **unused** → để fresh-rebuild tự tạo.)
- **Đồng bộ history** — đánh dấu applied 12 migration áp-tay-chưa-ghi (đã verify object tồn tại trước). Kết quả: **remote 29 = local 29, không lệch 2 chiều** → `supabase db push` giờ chạy sạch.

## ⏳ CÒN LẠI
- **ib/verify validator mock** — cần tích hợp API GTC thật (không sửa được ở code).
- **Frontend B3 (hoãn có chủ đích):** tách landing `page.tsx` (642 dòng) thành Server Component + islands — cần QA click-through trong browser, rủi ro cao nếu làm blind. Làm ở lượt riêng có preview.
- **Full `next/font`** (thay vì `<link>`) — cần rename font-family literal ở nhiều file + QA visual; `<link>` hiện tại đã lấy phần lớn lợi ích.
- Đổi money columns `real`→`numeric` (M1) khi có thời gian.
- 🔐 **Đổi DB password** (đã lộ trong chat).

---

## 0. Baseline (trung tâm)

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | ✅ PASS (exit 0) |
| `npx tsc --noEmit` | ✅ sạch (chỉ lỗi có sẵn ở `thesis-history.test.ts`) |
| `npx vitest run` | ❌ **4 đỏ / 164** — 3 webhook mock (`.select/.upsert` mock thiếu, đã biết) + 1 stale (`checkout/success` assert thiếu `&oid=cs_test`). Không phải bug logic route, nhưng CI đang đỏ. |

---

## 1. 🔴 BLOCKER (chặn release)

### B1. Endpoint admin affiliate FAIL-OPEN — mọi user đăng nhập thành admin khi thiếu 1 env `[CONFIRMED]`
`src/app/api/admin/affiliate/payout/route.ts:25` · `src/app/api/admin/affiliate/settings/route.ts`
```ts
if (ADMIN_IDS.length > 0) return ADMIN_IDS.includes(user.id) ? user.id : null;
return user.id;   // AFFILIATE_ADMIN_IDS rỗng ⇒ MỌI user = admin
```
Nếu `AFFILIATE_ADMIN_IDS` không set trên prod (dễ quên), bất kỳ user đăng nhập nào cũng có thể: `pay_payout`/`mark_paid` (kích hoạt chi tiền + gian lận sổ sách), sửa `commission_rate`, duyệt/khóa/xóa affiliate, **dump email khách (PII)**. Các route admin khác dùng `getAdmin()`/`can()` (an toàn) — 2 route này là ngoại lệ.
→ **Fix:** thay bằng `getAdmin()` + `can(admin,'affiliate.manage')`; bỏ nhánh `return user.id`. Fail-closed khi rỗng.

### B2. `/api/ib/verify` — cổng cấp license IB vừa HỎNG vừa KHÔNG bảo mật `[CONFIRMED]`
`src/app/api/ib/verify/route.ts`
- **Không auth, không rate-limit, validator là mock** (`/^\d{6,10}$/`, comment ghi rõ "Mock") → máy phát license lifetime miễn phí + link tải EA cho bất kỳ ai, cấp cho **bất kỳ số MT5 nào** (chiếm slot của khách thật qua `onConflict mt5_account`).
- **`onConflict:"mt5_account"` khớp với PARTIAL unique index** (`... where mt5_account is not null`) → Postgres báo `42P10` **mỗi lần gọi**. Route **không destructure `error`** → trả HTTP 200 với `licenseKey:null`. **Toàn bộ funnel free-tier TiGold cấp key rỗng, im lặng.** (DB agent xác minh live: mọi call throw 42P10.)
→ **Fix:** (1) thay validator mock bằng verify thật với broker/IB; (2) thêm auth + rate-limit + try/catch + destructure error; (3) DB: đổi partial index thành `UNIQUE(mt5_account)` thường để upsert khớp.

### B3. Sub `past_due`/`unpaid` KHÔNG thu hồi license → dùng VIP free sau khi card fail `[PLAUSIBLE]`
`src/app/api/stripe/webhook/route.ts:96-133`
`customer.subscription.updated` **luôn** đẩy `expires_at = currentPeriodEnd` cho key `unlimited`, kể cả khi status `past_due`/`unpaid` (sub row đã về `free` nhưng license thì không). `subscriptionPeriodEndIso()` không bao giờ null (fallback now+1mo). EA validate chỉ check `expires_at` → **cả 3 EA chạy free thêm nguyên 1 kỳ** cho tới khi `subscription.deleted`.
→ **Fix:** chỉ gia hạn license khi `hasProAccess(status)`; ngược lại thu hồi (như handler `deleted`).

---

## 2. 🟠 HIGH

### H1. RLS rò rỉ dữ liệu trả phí — free user đọc trọn `evidence_observations` (4065 dòng) + `thesis_snapshots` `[CONFIRMED live]`
migration `20260612153000_gold_decision_intelligence.sql:33-35,58-60` — policy `for select using (auth.role()='authenticated')`. API app gate data này sau `getUserPlanTierByUserId` (VIP), nhưng RLS cho **mọi user đăng nhập** đọc thẳng qua PostgREST. DB agent xác minh: free user thấy 4065 + 20 dòng.
→ **Fix:** siết policy về `exists(select 1 from subscriptions where user_id=auth.uid() and status='active')` hoặc bỏ hẳn SELECT policy, chỉ phục vụ qua API service-role đã gate.

### H2. `getPlanDetailsByUserId` `nullsFirst` chọn key lifetime cũ → VIP vĩnh viễn free `[PLAUSIBLE]`
`src/lib/subscription-gate.ts:49-59` — `order("expires_at", nullsFirst:true).limit(1)`: key `expires_at=null` luôn sắp trước. Migration `20260628120000` back-fill `is_lifetime=true` cho **mọi** row null-expiry → khách VIP cũ có thể thành comp trọn đời. `resolvePlan` chặn đúng cho `is_lifetime=false`, nhưng cần audit back-fill xem có biến rental thành lifetime không.
→ **Fix:** resolve trên TẤT CẢ key (max của {lifetime hợp lệ, expiry tương lai xa nhất}), không tin `nullsFirst`; audit lại migration back-fill.

### H3. Self-referral — affiliate ăn hoa hồng trên chính đơn của mình `[PLAUSIBLE]`
`src/lib/affiliate/server.ts` `convertReferral`/`recordAffiliateCommission` — không chặn `customer_id == affiliate.user_id`. Affiliate tự click link → mua VIP → nhận 30% + mọi kỳ renew. Thất thoát tiền trực tiếp.
→ **Fix:** reject khi customer.user_id == affiliate.user_id.

### H4. Webhook không idempotent theo event → nhân đôi hoa hồng khi Stripe redeliver `[PLAUSIBLE]`
`src/app/api/stripe/webhook/route.ts` — không có bảng `stripe_events`. Commission chỉ idempotent khi `external_ref` (invoice) khác null; `checkout.session.completed` có `invoice=null` → **redeliver tạo commission trùng** + email/admin-event trùng.
→ **Fix:** bảng `stripe_events(event_id pk)` guard đầu handler; ép commission có idempotency key non-null (fallback session id).

### H5. Payout settle theo balance LIVE thay vì snapshot đã duyệt (TOCTOU) `[CONFIRMED logic]`
`src/lib/affiliate/server.ts` `settlePayoutAsPaid` — bỏ qua `payout.amount` đã snapshot lúc request, settle **toàn bộ pending hiện tại** + ghi đè amount. Giữa lúc request và "Mark paid", commission mới cộng thêm → admin chuyển tay $50 nhưng hệ thống flip $110 pending→paid. Sổ lệch. *(Đây là logic mình viết ở tính năng payout — cần sửa.)*
→ **Fix:** settle đúng commission tính tới `requested_at` (hoặc snapshot commission ids), trả đúng `payout.amount` đã duyệt.

### H6. Telegram webhook fail-open khi thiếu secret `[CONFIRMED pattern]`
`src/app/api/telegram/webhook/route.ts:25-32` — chỉ verify chữ ký NẾU `TELEGRAM_WEBHOOK_SECRET` set. Thiếu env → nhận request không ký. (Đối chiếu: Stripe webhook fail-closed đúng.)
→ **Fix:** fail-closed khi secret rỗng.

### H7. Frontend: font Google load bằng `@import` render-blocking + landing là 1 client component khổng lồ `[CONFIRMED]`
- `src/app/globals.css:1` — `@import url(fonts.googleapis...)` chặn render (3 hop nối tiếp, không preconnect); JetBrains Mono (font body) kẹt sau path chậm này, phủ định `next/font`. → chuyển hết vào `next/font/google`.
- `src/app/page.tsx:1` — cả landing 642 dòng là `"use client"`; gần như toàn nội dung tĩnh vẫn hydrate. → tách island tương tác, để shell là Server Component.

---

## 3. 🟡 MEDIUM

- **M1. Tiền lưu kiểu `real` (float)** — `affiliate_commissions.amount/source_amount`, `affiliates.total_earned/paid_out`, `affiliate_payouts.amount`, `commission_rate`. Drift làm tròn + counter read-modify-write không atomic/không transaction. → `numeric(12,2)` hoặc integer cents; increment bằng SQL atomic. `[CONFIRMED]`
- **M2. Sổ affiliate âm** — affiliate `6dacf287…`: `paid_out=283.6` > `total_earned=183.6` (−100), payouts (100+119.8) không khớp `paid_out`. → reconcile tay + `CHECK(paid_out<=total_earned)` hoặc tính balance từ bảng nguồn. `[CONFIRMED live]`
- **M3. Migration drift (rủi ro DR/staging)** — `subscriptions` & `profiles` **không có migration CREATE** (build tay qua SQL Editor); `vps_assignments` trong migration nhưng **chưa apply live**. Fresh rebuild từ `supabase/migrations/` sẽ **thiếu subscriptions/profiles** → webhook/profile 500. → viết migration CREATE (IF NOT EXISTS) khớp live + `supabase migration repair`. `[CONFIRMED live]`
- **M4. Không xử lý refund/chargeback** — không có case `charge.refunded`/`dispute` trong webhook; commission của đơn đã hoàn vẫn `pending`→payable; enum `refunded` không bao giờ được set. → thêm handler hủy commission + cửa sổ maturation trước khi payable. `[PLAUSIBLE]`
- **M5. `paid_out` double-count** — 2 đường (`mark_paid` per-commission & `pay_payout` per-payout) đều cộng `paid_out` không check status trước → chạy chồng làm phồng số. → chỉ cộng cho row thực sự `pending` lúc update. `[PLAUSIBLE]`
- **M6. Ghi im lặng bỏ qua affected-rows** — nhiều mutation admin/webhook trả `success:true` dù 0 row (approve/reject/suspend affiliate, revoke_license, sub-admins update/delete, license expiry sync). → `.select("id")` + 404 khi 0 row (pattern đã đúng ở `admin/licenses`). `[CONFIRMED]`
- **M7. Frontend perf/polish** — orphaned routes (`/dashboard/chart|correlation|drivers|replay` có page nhưng không có nav) `[CONFIRMED]`; duplicate polling `/api/user/notifications` (bell + ticker cùng 60s) `[CONFIRMED]`; theme FOUC (html hardcode `dark`, light apply sau mount) + locale flash (resolve sau mount) `[CONFIRMED]`; widget dashboard không code-split cho free user.

---

## 4. 🟢 LOW / hygiene
- Test CI đỏ 4 ca (webhook mock thiếu `.select/.upsert`; `checkout/success` assert stale thiếu `&oid=`). → sửa mock/assert cho CI xanh.
- Dead dep `lightweight-charts` (không import đâu); font `Playfair Display` request nhưng không dùng. → gỡ.
- Error message echo raw PostgREST `error.message` ra client (nhiều route admin + `user/ai-credentials`). → message generic ở prod.
- Rate limiter in-memory per-instance (Vercel multi-instance nhân giới hạn, không prune). → Redis/Upstash/KV khi scale.
- `AFFILIATE_ADMIN_IDS` trong `admin/auth.ts` = synth **super_admin** toàn quyền (không chỉ affiliate). → tách `SUPER_ADMIN_IDS` hoặc bỏ env fallback ở prod.
- Login/signup không rate-limit tầng app (dựa Supabase). → bật captcha/throttle Supabase.
- `html{font-size:20px}` scale mọi rem ×1.25 — QA kỹ mobile 320–375px.
- Light mode: `text-primary/secondary/muted` cùng `#1E2329` (mất phân cấp muted/placeholder). → ramp 3 mức.

---

## 5. ✅ Đã xác minh ĐÚNG (không cần sửa)
- Không rò secret ra client bundle (chỉ `NEXT_PUBLIC_*` hợp lệ). Stripe webhook verify chữ ký + fail-closed đúng.
- RLS trên bảng nhạy cảm (license_keys, affiliates, subscriptions, admin_users, profiles, license_devices…) **chặn đúng** anon + authenticated-not-owner (0 row); **không self-insert admin_users**, không tự set `profiles.plan='unlimited'`.
- Service-role queries ở `user/*`, `partner/*`, `stripe/portal|checkout` đều scope theo `user.id` (không IDOR).
- License validate: `.eq("key")` (không injection), gate per-EA + expiry + anti-share race-safe. Tạo 3 key VIP đúng `max_accounts` (2/2/1), `is_lifetime=false`, có expiry. `subscription.deleted` downgrade đúng.
- `license_keys` unique(user_id,product) đã đúng (handoff cũ nói unique(user_id) — thực ra `20260629020000` đã drop & thay). Data license sạch: 0 row `is_lifetime=false & expires_at=null`, 0 trùng.
- Timer/interval frontend đều cleanup + AbortController; destructive admin actions đều có `confirm()`; admin panel có Loading/Error/Empty; v1 alerts/indicators là redirect (không 404).

---

## 6. Thứ tự sửa đề xuất (gate release)
1. **B1** admin affiliate fail-closed (nhỏ, nguy hiểm nhất).
2. **B2** ib/verify: auth + rate-limit + error handling + fix unique index (funnel đang chết).
3. **B3** past_due thu hồi license.
4. **H1** RLS evidence/thesis siết theo paid.
5. **H2** plan resolve + audit back-fill lifetime.
6. **H3/H4/H5** self-referral, webhook idempotency, payout snapshot.
7. **H6** telegram fail-closed.
8. **M3** migration CREATE subscriptions/profiles + repair (trước `db push` / staging).
9. **M2** reconcile sổ affiliate âm.
10. **H7 + M7** frontend perf trước public launch.
