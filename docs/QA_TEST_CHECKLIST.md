# Dralvo — Checklist Test Toàn Bộ Chức Năng

> Checklist QA thủ công cho web app `dralvo-landing` (Next.js App Router + Supabase +
> Stripe/VietQR + Telegram). Dùng để regression test trước khi deploy.
>
> **Quy ước:** `[ ]` chưa test · `[x]` pass · `[!]` fail (ghi chú bug).
> Mỗi mục test trên cả **desktop + mobile** và cả **light/dark theme** + **vi/en locale**
> trừ khi nói khác.

---

## 0. Chuẩn bị môi trường

- [ ] `npm install` chạy sạch, không lỗi peer deps
- [ ] `.env.local` đầy đủ biến theo `.env.example` (Supabase, Stripe, SMTP, Telegram…)
- [ ] `npm run dev` lên được http://localhost:3000 không lỗi
- [ ] `npm run build` thành công (production build)
- [ ] `npm run lint` — 0 warning
- [ ] `npm run test` — toàn bộ unit test (Vitest) pass
- [ ] `npm run audit:encoding` — không có mojibake
- [ ] `npm run audit:secrets` — không lộ secret
- [ ] `npm run audit:vulnerabilities` — không có lỗ hổng high/critical

---

## 1. Trang Marketing / Public

### 1.1 Landing page (`/`)
- [ ] Hero load đúng, không lỗi console, không layout shift
- [ ] Bộ chuyển kỳ hạn giá (monthly / 6 tháng / yearly) đổi đúng total + per-month + % off
- [ ] Danh sách sản phẩm EA (GoldMaster, Gold Scalp, TiGold) hiển thị stats đúng
- [ ] Equity curve / animation render mượt, tôn trọng `prefers-reduced-motion`
- [ ] Nav bar: link đến Pricing, Methodology, Track record, Login, Signup hoạt động
- [ ] Menu mobile (hamburger) mở/đóng đúng
- [ ] Language switcher (vi/en) đổi toàn bộ copy
- [ ] Theme toggle (light/dark) đổi đúng, lưu lại sau reload
- [ ] CTA chính (đăng ký / mua) điều hướng đúng
- [ ] Affiliate referral tracker bắt được `?ref=` query (xem mục 6)

### 1.2 Các trang nội dung tĩnh
- [ ] `/pricing` — bảng giá, các tier (Free / VIP), nút checkout đúng
- [ ] `/methodology` — render đầy đủ
- [ ] `/track-record` — số liệu, biểu đồ load đúng
- [ ] `/compare` — bảng so sánh sản phẩm
- [ ] `/tigold` — landing riêng cho TiGold
- [ ] `/tools/calculator` — máy tính (lot size / risk?) tính đúng các input biên
- [ ] `/disclaimer`, `/privacy`, `/terms` — load, nội dung pháp lý đầy đủ
- [ ] SEO: title/description, OpenGraph, `robots.txt`, `sitemap.xml`, favicon

---

## 2. Xác thực (Auth)

### 2.1 Đăng ký (`/signup`)
- [ ] Đăng ký email/password thành công → email xác nhận gửi đi
- [ ] Validation: email sai định dạng, password yếu, field trống
- [ ] Đăng ký trùng email → báo lỗi rõ ràng
- [ ] Callback `/auth/callback` xử lý đúng sau khi confirm email

### 2.2 Đăng nhập (`/login`)
- [ ] Login đúng credential → redirect vào `/dashboard`
- [ ] Login sai password → báo lỗi, không lộ thông tin
- [ ] OAuth (nếu có) hoạt động
- [ ] Redirect giữ lại trang đích sau khi login (nếu vào từ trang gated)

### 2.3 Reset password (`/reset-password`)
- [ ] Gửi yêu cầu reset → email chứa link hợp lệ
- [ ] Đặt lại password mới thành công, login lại được
- [ ] Link hết hạn / sai token → báo lỗi

### 2.4 Session & bảo vệ route
- [ ] Truy cập `/dashboard/*` khi chưa login → bị redirect về login
- [ ] Truy cập `/admin/*` khi không phải admin → bị chặn (403/redirect)
- [ ] Logout xoá session, không quay lại được trang gated bằng nút Back

---

## 3. Dashboard (người dùng đã đăng nhập)

> Kiểm tra **gating theo plan**: tài khoản Free vs VIP (license/subscription).

### 3.1 Tổng quan (`/dashboard`)
- [ ] Trang load đúng cho user Free và user VIP
- [ ] Hiển thị đúng plan tier (Free / VIP) và ngày hết hạn nếu có
- [ ] Sidebar/layout điều hướng tới các mục con hoạt động

### 3.2 Chỉ báo & dữ liệu thị trường
- [ ] `/dashboard/indicators` — danh sách indicator, giá trị, trạng thái
- [ ] `/dashboard/chart` — biểu đồ XAUUSD (lightweight-charts) render, zoom/pan đúng
- [ ] `/dashboard/correlation` — ma trận/biểu đồ tương quan
- [ ] `/dashboard/drivers` — driver history hiển thị đúng, lọc theo thời gian
- [ ] `/dashboard/replay` — replay thesis theo ngày lịch sử chạy đúng
- [ ] Gating: tính năng VIP bị khoá/teaser với user Free, mở với user VIP

### 3.3 Cảnh báo (`/dashboard/alerts`)
- [ ] Tạo alert mới (chọn điều kiện) thành công
- [ ] Sửa / xoá alert
- [ ] Bật/tắt alert
- [ ] Alert được đánh giá (evaluate) và tạo notification khi điều kiện thỏa
- [ ] Test-notification gửi được qua kênh đã cấu hình (email/telegram)

### 3.4 Kho EA (`/dashboard/kho`)
- [ ] Danh sách EA/file tải về hiển thị đúng theo quyền
- [ ] User Free không tải được file VIP; user VIP tải được
- [ ] Link tải hoạt động, file đúng

### 3.5 Cài đặt (`/dashboard/settings`)
- [ ] Cập nhật preferences (ngôn ngữ, theme, thông báo) lưu lại
- [ ] Quản lý license devices: xem danh sách thiết bị, gỡ thiết bị
- [ ] Cập nhật AI credentials (API key) — lưu/ẩn an toàn, không lộ ở client
- [ ] Kết nối Telegram (mục 8) hiển thị trạng thái đúng
- [ ] Notification center: đánh dấu đã đọc 1 cái / tất cả

---

## 4. Thanh toán & Gói (Billing)

### 4.1 Stripe
- [ ] Checkout: chọn gói VIP (monthly/6mo/yearly) → tạo session đúng giá
- [ ] Thanh toán thành công → redirect `success`, plan nâng lên VIP
- [ ] Webhook Stripe cập nhật subscription status đúng (active/canceled/past_due)
- [ ] Customer Portal mở được, hủy/đổi gói phản ánh lại trong app
- [ ] User hủy → khi hết kỳ thì rớt về Free đúng thời điểm

### 4.2 VietQR / thanh toán thủ công (nếu bật)
- [ ] Tạo QR đúng số tiền, nội dung chuyển khoản
- [ ] Sau khi admin xác nhận → cấp license VIP đúng hạn

### 4.3 License
- [ ] License hợp lệ (còn hạn / lifetime) → tier = VIP
- [ ] License hết hạn → rớt về Free
- [ ] `/api/license/validate` trả đúng trạng thái cho EA/MT5 client (yêu cầu `key` + `account` + `product`)
- [ ] Anti-share: bind tối đa `max_accounts` tài khoản MT5 (TOFU); account thứ N+1 bị `account_limit`
- [ ] **`max_accounts` là nguồn-sự-thật**: key có `mt5_account` chỉ khóa cứng 1 account khi `max_accounts ≤ 1`; admin nâng max acc > 1 → dashboard (EA card) + validate phản ánh đúng (xem HANDOFF §2.4)
- [ ] EA card trên `/dashboard`: xem/sửa/xoá/thêm tài khoản MT5 theo từng EA, đếm đúng `dùng/max`

---

## 5. Tín hiệu AI & Luận điểm (Thesis / Signal)

- [ ] `/api/signal/current` & `/api/thesis/today` trả tín hiệu hôm nay đúng
- [ ] `/api/thesis/history` & `/api/thesis/replay` trả lịch sử/replay đúng
- [ ] `/api/thesis/ai-signal` sinh tín hiệu khi có AI credentials hợp lệ
- [ ] Thiếu/sai AI credentials → báo lỗi gọn, không crash
- [ ] Rate limit hoạt động (gọi liên tục bị chặn đúng cách)
- [ ] Backtest: `/api/backtest/parse-strategy` parse strategy đúng, báo lỗi input xấu

---

## 6. Affiliate / IB

### 6.1 Phía người dùng
- [ ] Truy cập link `?ref=CODE` → tracker ghi nhận (cookie/localStorage)
- [ ] `/affiliate` & `/dashboard/affiliate` hiển thị thống kê, link giới thiệu
- [ ] Đăng ký làm affiliate (`/api/affiliate/apply`) hoạt động
- [ ] Conversion được ghi nhận khi referral mua hàng (`/api/affiliate/convert`)
- [ ] Thống kê (`/api/affiliate/stats`) số click/đăng ký/hoa hồng đúng
- [ ] IB verify (`/api/ib/verify`) xác minh tài khoản broker đúng
- [ ] **Request rút tiền** (`POST /api/affiliate/payout`): chỉ bật khi affiliate `active` + số dư ≥ `min_payout`; chặn khi đã có yêu cầu đang mở
- [ ] Form nhận tiền — **VN bank**: chọn ngân hàng + STK (6–19 số) + chủ TK; **USDT**: chọn network (TRC20/BEP20/ERC20/Solana/Polygon) + địa chỉ ví (validate theo network)
- [ ] Sau khi gửi: CTA chuyển sang pending + hiện lại đích nhận tiền đã chọn

### 6.2 Phía admin
- [ ] `/admin/affiliate` & `/dashboard/admin/affiliate` xem danh sách affiliate
- [ ] Cấu hình tỉ lệ hoa hồng (`/api/admin/affiliate/settings`) lưu đúng
- [ ] Tab **Payouts**: thấy yêu cầu rút + cột "Nhận tiền" (bank/USDT) để chuyển tay
- [ ] "Mark paid" (`pay_payout`) → commission `pending`→`paid`, cộng `paid_out`; "Reject" (`reject_payout`) đổi trạng thái. **Lưu ý: chuyển tiền là thủ công ngoài hệ thống.**

---

## 7. Khu vực Admin

> Test với tài khoản admin và sub-admin (phân quyền).

- [ ] `/admin` overview — số liệu tổng quan (`/api/admin/overview`) đúng
- [ ] `/admin/users` — danh sách user, tìm kiếm, sửa role/plan
- [ ] `/admin/licenses` — tạo/gia hạn/thu hồi license, lifetime comp
- [ ] `/admin/finance` — doanh thu, giao dịch khớp số liệu Stripe
- [ ] `/admin/admins` & sub-admins — thêm/xoá quyền, phân quyền có hiệu lực
- [ ] `/admin/notifications` — gửi thông báo hệ thống tới user/nhóm
- [ ] `/admin/affiliate` (xem mục 6.2)
- [ ] Notification settings (`/api/admin/notification-settings`) lưu đúng
- [ ] Sub-admin chỉ thấy/làm được phần được cấp quyền

---

## 8. Telegram

- [ ] `/api/telegram/connect` — tạo link/deep-link kết nối tài khoản
- [ ] Người dùng /start bot → liên kết đúng user, hiển thị "đã kết nối" trong settings
- [ ] `/api/telegram/webhook` xử lý lệnh & message không lỗi
- [ ] `npm run telegram:webhook` set webhook thành công
- [ ] Alert/notification đẩy về Telegram đúng nội dung

---

## 9. Notifications (chung)

- [ ] `/api/user/notifications` list đúng, phân trang nếu có
- [ ] Đánh dấu đã đọc 1 (`/read`) và tất cả (`/read-all`)
- [ ] Chuông + hộp thư (`/dashboard/notifications`) + ticker + thông báo hệ thống (admin phát) đồng bộ với nhau
- [ ] Dispatch qua kênh đã bật (in-app, email SMTP) tới nơi — *(Telegram + run-logs đã bỏ ở cài đặt thông báo)*
- [ ] Email render đúng (không vỡ HTML, link hợp lệ)

---

## 10. Pipeline dữ liệu & Ops

### 10.1 Ingestion
- [ ] `/api/ingest` (tổng) chạy đúng, có auth/secret bảo vệ
- [ ] Backfill: CFTC, GLD, TIPS, XAUUSD chạy không lỗi, ghi DB đúng
- [ ] `/api/ingest/thesis` cập nhật thesis
- [ ] `/api/cftc-status` báo trạng thái nguồn CFTC
- [ ] Seed scripts: `data:seed`, `data:seed:twelve`, `data:seed:dukascopy` chạy được
- [ ] Fetchers (cftc, comex, gld, tips, xauusd-spot, sma) — unit test pass & dữ liệu hợp lý

### 10.2 Ops / Monitoring
- [ ] `/api/ops/launch-readiness` — checklist sẵn sàng launch đúng trạng thái
- [ ] `/api/ops/source-alerts` — cảnh báo nguồn dữ liệu cũ/lỗi (freshness)
- [ ] `/api/ops/run-logs` — log các lần chạy job
- [ ] `/api/ops/product-analytics` — số liệu sản phẩm
- [ ] `/api/ops/evidence-corrections` — hiệu chỉnh dữ liệu evidence
- [ ] `/api/ops/system-notifications` — thông báo hệ thống
- [ ] `/api/analytics/events` — ghi nhận event đúng schema

---

## 11. API tiện ích & Export

- [ ] `/api/health` trả 200, trạng thái dịch vụ
- [ ] `/api/xauusd` & `/api/indicators` trả dữ liệu đúng định dạng
- [ ] `/api/drivers/history` lọc theo tham số đúng
- [ ] `/api/export/csv` xuất CSV đúng cột, encoding UTF-8
- [ ] `/api/waitlist` ghi nhận đăng ký waitlist, chống spam/dup

---

## 12. Cross-cutting (xuyên suốt)

### 12.1 Bảo mật & phân quyền
- [ ] API route yêu cầu auth đều trả 401/403 khi gọi ẩn danh
- [ ] Secret server-only KHÔNG lộ ra client bundle
- [ ] Rate limit áp dụng cho endpoint nhạy cảm (auth, ai-signal, waitlist)
- [ ] Webhook (Stripe/Telegram) verify chữ ký/secret, chối request giả
- [ ] Không IDOR: user A không xem/sửa được dữ liệu user B

### 12.2 UX / hiển thị
- [ ] Responsive: mobile, tablet, desktop không vỡ layout
- [ ] Light/dark theme nhất quán mọi trang
- [ ] i18n vi/en đầy đủ, không còn key thô / chữ lẫn ngôn ngữ
- [ ] Loading/empty/error states hiển thị tử tế (không trắng trang)
- [ ] Form: validation, disable nút khi submit, thông báo thành công/lỗi
- [ ] Accessibility cơ bản: focus, alt text, contrast, keyboard nav

### 12.3 Hiệu năng & ổn định
- [ ] Không lỗi/đỏ trong console ở các trang chính
- [ ] Không memory leak rõ rệt khi điều hướng qua lại
- [ ] Ảnh/asset tối ưu, không tải file thừa quá lớn
- [ ] 404 page & error boundary hoạt động

---

## 13. Smoke test trước deploy (rút gọn)

- [ ] Build + lint + test pass
- [ ] Đăng ký → login → thấy dashboard
- [ ] Mua VIP (test mode) → tier nâng lên → tải được file VIP
- [ ] Tạo alert → nhận notification
- [ ] Admin xem được overview & users
- [ ] `/api/health` = 200 trên môi trường staging
