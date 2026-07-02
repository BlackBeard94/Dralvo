/**
 * Backoffice documentation content. Authored as Markdown, rendered server-side
 * with the blog renderer. Extend by adding entries to DOC_SECTIONS — each shows
 * up in the sidebar TOC under its `group`.
 */

export const DOC_GROUPS = ["Bắt đầu", "API cho Agent", "Chức năng Admin Panel"] as const;
export type DocGroup = (typeof DOC_GROUPS)[number];

export type DocSection = { id: string; title: string; group: DocGroup; body: string };

export const DOC_SECTIONS: DocSection[] = [
  /* ----------------------------- Bắt đầu ----------------------------- */
  {
    id: "gioi-thieu",
    title: "Giới thiệu",
    group: "Bắt đầu",
    body: `Trang tài liệu này mô tả **cách vận hành từng mục trong admin panel** và **cách agent/hệ thống ngoài gọi API** của Dralvo.

- Phần **API cho Agent**: dành cho agent (vd Paperclip) hoặc dev tích hợp — có ví dụ request/response.
- Phần **Chức năng Admin Panel**: dành cho quản trị viên/nhân sự vận hành.

> Mọi endpoint agent đều dùng HTTPS, base URL là \`https://www.dralvo.com\`.`,
  },
  {
    id: "xac-thuc",
    title: "Xác thực API (API Keys)",
    group: "Bắt đầu",
    body: `Agent xác thực bằng **API key** tạo trong mục **API Keys** (chỉ super_admin tạo được).

### Cách lấy key
1. Vào **Admin → API Keys → Tạo key mới**.
2. Đặt tên agent + **tích các quyền (scope)** cần thiết.
3. Copy secret **ngay** — nó chỉ hiện **một lần**, sau đó chỉ còn hash.

### Gửi key trong request
Dùng một trong hai header:

\`\`\`http
Authorization: Bearer drv_xxxxxxxxxxxxxxxx
# hoặc
x-api-key: drv_xxxxxxxxxxxxxxxx
\`\`\`

### Bộ quyền (scope)
| Scope | Cho phép |
|---|---|
| \`blog:write\` | Viết/đăng blog + upload ảnh |
| \`ops:overview\` | Đọc số liệu tổng quan |
| \`ops:customers\` | Feed khách mới + thanh toán |
| \`ops:marketing\` | Số liệu funnel marketing |
| \`ops:grant_key\` | Cấp license free cho user |

### Quy tắc chung
- Key sai / bị tắt / thiếu scope → trả **401 Unauthorized**.
- Key lưu dạng **hash SHA-256**, không thể xem lại secret.
- Mỗi lần gọi thành công tự cập nhật **last_used_at**.
- Endpoint có **rate limit** (vd blog: 30 request/phút/IP).`,
  },

  /* -------------------------- API cho Agent -------------------------- */
  {
    id: "api-ops-overview",
    title: "GET /api/agent/ops/overview",
    group: "API cho Agent",
    body: `Số liệu tổng quan cho vận hành. **Scope:** \`ops:overview\`.

**Query:** \`from\`, \`to\` (YYYY-MM-DD, mặc định 30 ngày gần nhất).

\`\`\`bash
curl "https://www.dralvo.com/api/agent/ops/overview?from=2026-06-01&to=2026-07-01" \\
  -H "Authorization: Bearer drv_xxx"
\`\`\`

**Response:**
\`\`\`json
{
  "ok": true,
  "range": { "from": "...", "to": "..." },
  "users": { "total": 33, "vip": 14, "tigold": 0, "free": 19, "newInRange": 33 },
  "activeByEa": { "goldmaster": 14, "goldscalp": 14, "tigold": 5 },
  "subscriptions": { "active": 14, "revenueInRangeUSD": 826 },
  "generatedAt": "..."
}
\`\`\``,
  },
  {
    id: "api-ops-customers",
    title: "GET /api/agent/ops/customers",
    group: "API cho Agent",
    body: `Feed khách mới đăng ký + thanh toán mới. **Scope:** \`ops:customers\`.

**Query:** \`limit\` (1–100, mặc định 20), \`since\` (ISO, lọc theo created_at).

\`\`\`bash
curl "https://www.dralvo.com/api/agent/ops/customers?limit=20" \\
  -H "Authorization: Bearer drv_xxx"
\`\`\`

**Response:** chỉ trả PII tối thiểu (email + gói + thời gian).
\`\`\`json
{
  "ok": true,
  "newCustomers": [ { "email": "a@x.com", "signedUpAt": "..." } ],
  "newPayments": [ { "email": "b@x.com", "plan": "unlimited", "amountUSD": 59, "paidAt": "..." } ]
}
\`\`\``,
  },
  {
    id: "api-ops-marketing",
    title: "GET /api/agent/ops/marketing",
    group: "API cho Agent",
    body: `Funnel quảng cáo: leads / conversions / CVR / doanh thu theo kênh & chiến dịch. **Scope:** \`ops:marketing\`.

**Query:** \`from\`, \`to\` (lọc theo first_seen_at, mặc định 30 ngày).

\`\`\`json
{
  "ok": true,
  "totals": { "leads": 120, "conversions": 8, "cvr": 6.7, "revenue": 472 },
  "byChannel": [ { "key": "google", "leads": 60, "conversions": 5, "revenue": 295, "cvr": 8.3 } ],
  "byCampaign": [ { "key": "gold-ea-vn", "leads": 40, "conversions": 3, "revenue": 177, "cvr": 7.5 } ]
}
\`\`\`

> "Converted" = user được gán nguồn đó hiện có subscription active. Doanh thu dùng proxy $59/sub.`,
  },
  {
    id: "api-ops-grant-key",
    title: "POST /api/agent/ops/grant-key",
    group: "API cho Agent",
    body: `Cấp license free cho user theo email. **Scope:** \`ops:grant_key\`. Mỗi lần cấp được **ghi audit log**.

**Body:**
| Field | Bắt buộc | Ghi chú |
|---|---|---|
| \`email\` | ✓ | Email user (phải đã đăng ký) |
| \`plan\` | | \`"tigold"\` (mặc định) hoặc \`"unlimited"\` |
| \`product\` | | 1 EA: \`goldmaster\` / \`goldscalp\` / \`tigold\` |
| \`allProducts\` | | \`true\` = cấp trọn bộ VIP (3 EA) |
| \`maxAccounts\` | | Số tài khoản tối đa (chống share) |

\`\`\`bash
curl -X POST https://www.dralvo.com/api/agent/ops/grant-key \\
  -H "Authorization: Bearer drv_xxx" -H "Content-Type: application/json" \\
  -d '{ "email": "user@x.com", "plan": "tigold", "product": "tigold" }'
\`\`\`

**Response:** \`{ "success": true, "email": "...", "plan": "tigold", "products": ["tigold"] }\`

Upsert idempotent trên (user_id, product) — gọi lại không tạo trùng. Lỗi: \`user_not_found\` (404), \`invalid_plan\`/\`invalid_product\` (400).`,
  },
  {
    id: "api-blog",
    title: "POST /api/agent/blog (viết & đăng)",
    group: "API cho Agent",
    body: `Tạo/cập nhật bài blog. **Scope:** \`blog:write\` (hoặc key legacy \`BLOG_AGENT_API_KEY\`).

**GET /api/agent/blog** → trả hướng dẫn viết bài + danh sách bài. **POST** để tạo/sửa.

**Body chính:**
| Field | Ghi chú |
|---|---|
| \`slug\` | Định danh bài; cùng slug + khác \`locale\` = bản dịch |
| \`locale\` | \`vi\` / \`en\` / \`pt-BR\` / \`es\` / \`id\` / \`ar\` |
| \`title\`, \`body\` | Tiêu đề + nội dung Markdown |
| \`excerpt\`, \`tags\`, \`faq\` | Tóm tắt, thẻ, FAQ (cho SEO/GEO) |
| \`meta_title\`, \`meta_description\` | SEO |
| \`cover_image_url\` | URL ảnh bìa (dùng endpoint upload bên dưới) |
| \`status\` | \`draft\` hoặc \`published\` |

\`\`\`bash
curl -X POST https://www.dralvo.com/api/agent/blog \\
  -H "Authorization: Bearer drv_xxx" -H "Content-Type: application/json" \\
  -d '{ "slug":"chon-ea-vang","locale":"vi","title":"...","body":"# ...","status":"published" }'
\`\`\`

> Đăng 1 ngôn ngữ là đủ. Muốn đa ngôn ngữ: gọi nhiều lần cùng \`slug\`, khác \`locale\`.`,
  },
  {
    id: "api-blog-upload",
    title: "POST /api/agent/blog/upload (ảnh)",
    group: "API cho Agent",
    body: `Upload ảnh, nhận về URL public để dùng làm \`cover_image_url\` hoặc chèn vào Markdown. **Scope:** \`blog:write\`.

Nhận **multipart** (field \`file\`) hoặc **JSON** \`{ data_base64, content_type }\`. Giới hạn 5MB.

\`\`\`bash
curl -X POST https://www.dralvo.com/api/agent/blog/upload \\
  -H "Authorization: Bearer drv_xxx" -F "file=@cover.png"
# → { "url": "https://.../blog-images/xxx.png" }
\`\`\``,
  },
  {
    id: "api-ea",
    title: "API cho EA (tham khảo)",
    group: "API cho Agent",
    body: `Các endpoint robot MT5 gọi (không dùng agent key — có cơ chế riêng). **Không sửa/xóa** vì EA ngoài thực tế đang gọi.

| Endpoint | Dùng bởi | Trả về |
|---|---|---|
| \`GET /api/cftc-status\` | GoldMaster | \`{ ok, bullish, mm_net, updated, ... }\` |
| \`GET /api/license/validate?key=&account=&product=\` | Cả 3 EA | \`{ valid: true/false, ... }\` |
| \`GET /api/signal/current\` | Dashboard/Telegram | Tín hiệu XAUUSD + entry + cftc |`,
  },

  /* --------------------- Chức năng Admin Panel ----------------------- */
  {
    id: "panel-tong-quan",
    title: "Tổng quan (Overview)",
    group: "Chức năng Admin Panel",
    body: `KPI toàn hệ thống + hoạt động theo khoảng thời gian.

- **Thẻ KPI (toàn thời gian):** tổng user, VIP đang active, phân bố gói (Free/VIP/TiGold), license theo từng EA.
- **Theo khoảng (chọn from–to):** user mới, license mới, sub mới, **doanh thu thật** (quét Stripe invoices đã thanh toán; fallback \`amount_usd\`).
- **Danh sách gần đây:** signup mới nhất + license mới nhất (kèm email).

*Quyền:* \`users.view\` (phần user) và/hoặc \`finance.view\` (phần doanh thu).`,
  },
  {
    id: "panel-nguoi-dung",
    title: "Người dùng (Users)",
    group: "Chức năng Admin Panel",
    body: `Tra cứu và quản lý user.

- Tìm theo email, xem gói/license, ngày đăng ký.
- Sửa thông tin user (cần \`users.edit\`).

*Quyền:* xem \`users.view\`, sửa \`users.edit\`.`,
  },
  {
    id: "panel-license",
    title: "License",
    group: "Chức năng Admin Panel",
    body: `Trung tâm cấp & quản lý license key.

- **Cấp key:** theo email + gói (\`tigold\` / \`unlimited\`). Chọn **1 EA** hoặc **trọn bộ VIP** (cấp cả 3 EA cùng lúc).
- **max_accounts:** số tài khoản MT5 tối đa mỗi key — đây là **nguồn chống share chính thức** (ưu tiên hơn trường \`mt5_account\` cũ). Chỉnh tại đây để nới/siết.
- **Thiết bị (devices):** xem tài khoản MT5 đã kích hoạt, **gỡ (unbind)** khi cần đổi máy.
- Upsert trên (user_id, product) → cấp lại không tạo trùng.

> Sub-admin chỉ thấy/sửa key do chính họ tạo (managed_by). Super_admin thấy tất cả.

*Quyền:* \`license.manage\` (hoặc \`users.view\`/\`users.edit\` tùy thao tác).`,
  },
  {
    id: "panel-kho-ea",
    title: "Kho EA (Vault)",
    group: "Chức năng Admin Panel",
    body: `Quản lý kho EA tải về (các EA bên thứ ba tặng kèm). Thêm/sửa/ẩn EA, quản lý file tải.

*Quyền:* super_admin.`,
  },
  {
    id: "panel-tai-chinh",
    title: "Tài chính (Finance)",
    group: "Chức năng Admin Panel",
    body: `Dòng tiền & thanh toán.

- Danh sách payment (Stripe), lọc theo khoảng thời gian (preset 30 ngày hoặc tùy chọn).
- Tổng hợp cashflow.

*Quyền:* \`finance.view\`.`,
  },
  {
    id: "panel-marketing",
    title: "Marketing",
    group: "Chức năng Admin Panel",
    body: `Funnel quảng cáo trả phí toàn hệ thống.

- Leads / conversions / CVR / doanh thu **theo kênh, theo chiến dịch, theo partner**.
- Danh sách conversion gần đây.
- Lọc theo khoảng thời gian và theo 1 partner.

*Quyền:* \`marketing.view\` (doanh thu nhạy cảm nên gate kỹ). Trùng logic với \`GET /api/agent/ops/marketing\`.`,
  },
  {
    id: "panel-pixel-tracking",
    title: "Pixel & Tracking quảng cáo",
    group: "Chức năng Admin Panel",
    body: `Cấu hình pixel để đo lường & tối ưu quảng cáo. **Vị trí:** Admin → **Marketing** → form *Pixel / Tracking*.

### Các pixel hỗ trợ (chạy trên trình duyệt)
| Nền tảng | Trường | Định dạng hợp lệ |
|---|---|---|
| Google Analytics 4 | GA4 ID | \`G-XXXXXXXXXX\` |
| Google Ads | Google Ads ID | \`AW-XXXXXXXXX\` |
| Google Ads — nhãn mua hàng | Purchase label | \`AW-XXXXXXXXX/abcDEF...\` |
| Meta (Facebook) Pixel | Meta Pixel ID | 6–20 chữ số |
| TikTok Pixel | TikTok Pixel ID | 8–32 ký tự chữ/số |

Ngoài ra có ô **Custom Head / Custom Body** để dán snippet thô (chỉ scope Dralvo; partner **không** được dán code thô).

### Cách hoạt động
- ID lưu ở bảng \`tracking_settings\` (scope \`dralvo\`). Chỉnh trong panel là **áp dụng ngay**, không cần deploy.
- **Ghi đè theo từng trường:** giá trị trong panel đè lên biến môi trường \`NEXT_PUBLIC_*\`. Ô nào để trống/không hợp lệ → tự **fallback về env**. Tắt công tắc **Enabled** → dùng toàn bộ env.
- **No-op an toàn:** chưa nhập ID nào thì pixel đó không chạy — ship trước khi có tài khoản ads vẫn an toàn.

### Fallback qua biến môi trường (đặt trên hosting)
\`\`\`bash
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL=AW-XXXXXXXXX/label
NEXT_PUBLIC_META_PIXEL_ID=1234567890
NEXT_PUBLIC_TIKTOK_PIXEL_ID=XXXXXXXXXXXX
\`\`\`

### Server-side Conversions API (đo chính xác hơn, chống mất dữ liệu do adblock)
Đặt **secret phía server** (KHÔNG phải NEXT_PUBLIC) trên hosting:
| Biến | Dùng cho |
|---|---|
| \`GA4_API_SECRET\` | GA4 Measurement Protocol |
| \`META_CAPI_ACCESS_TOKEN\` | Meta Conversions API |
| \`META_TEST_EVENT_CODE\` | Test event Meta (tùy chọn) |
| \`TIKTOK_EVENTS_ACCESS_TOKEN\` | TikTok Events API |

### Bảo mật & lưu ý
- Mọi ID được **validate bằng allowlist regex** trước khi nhúng vào \`<script>\` → không thể chèn mã độc (XSS). Giá trị sai bị coi như "chưa đặt".
- **Pixel của partner:** fire cho khách do partner đó giới thiệu (nhận diện qua cookie \`dralvo_partner\`).
- Attribution: last-touch; gắn nguồn (utm/gclid/fbclid/ttclid) cho lead → dùng ở mục **Marketing**.

*Quyền:* \`marketing.view\` (nằm trong mục Marketing).`,
  },
  {
    id: "panel-blog",
    title: "Blog",
    group: "Chức năng Admin Panel",
    body: `Soạn & xuất bản bài blog đa ngôn ngữ (SEO + GEO).

- Tạo/sửa bài: tiêu đề, Markdown, excerpt, tags, FAQ, ảnh bìa (upload trực tiếp), meta SEO.
- Trạng thái \`draft\`/\`published\`; mỗi (slug, locale) là 1 bản.
- Agent có thể tự đăng qua \`POST /api/agent/blog\` (scope \`blog:write\`).

*Quyền:* \`marketing.view\`.`,
  },
  {
    id: "panel-affiliate",
    title: "Affiliate",
    group: "Chức năng Admin Panel",
    body: `Quản lý chương trình giới thiệu.

- **Cấu hình:** % hoa hồng, thời gian cookie, mức rút tối thiểu (số hiển thị ngoài trang \`/affiliate\` lấy động từ đây).
- **Hoa hồng:** theo dõi pending/approved.
- **Yêu cầu rút tiền:** duyệt & đánh dấu đã thanh toán (VN bank / USDT theo mạng).

*Quyền:* \`affiliate.manage\`.`,
  },
  {
    id: "panel-partner",
    title: "Partner",
    group: "Chức năng Admin Panel",
    body: `Quản lý partner/IB (đối tác giới thiệu qua broker). Mã partner, khách quy về, số liệu quy đổi.

*Quyền:* super_admin.`,
  },
  {
    id: "panel-thong-bao",
    title: "Thông báo (Notifications)",
    group: "Chức năng Admin Panel",
    body: `Gửi/soạn thông báo hệ thống cho admin + cấu hình cảnh báo (vd chuông khi có doanh thu mới). Ai cũng xem được mục này.`,
  },
  {
    id: "panel-api-keys",
    title: "API Keys",
    group: "Chức năng Admin Panel",
    body: `Tạo & quản lý API key cho agent (xem chi tiết ở phần **Xác thực API**).

- Tạo key + tích chọn scope; secret hiện 1 lần.
- Bật/tắt, sửa quyền, thu hồi từng key. Tạo nhiều key cho nhiều agent, mỗi key quyền riêng.
- Key blog cũ (\`BLOG_AGENT_API_KEY\`) vẫn dùng được song song.

*Quyền:* **super_admin** (key đọc được dữ liệu khách + cấp license).`,
  },
  {
    id: "panel-quan-tri-vien",
    title: "Quản trị viên (Roles & Permissions)",
    group: "Chức năng Admin Panel",
    body: `Quản lý admin và phân quyền.

### Vai trò
- **super_admin** — toàn quyền, qua mọi cửa; là người duy nhất tạo API key.
- **admin** — quyền theo cấu hình (mặc định: xem user + tài chính).
- **support** — hạn chế (mặc định chỉ xem user).

### Nhóm quyền (scope)
| Scope | Ý nghĩa |
|---|---|
| \`users.view\` / \`users.edit\` | Xem / sửa user |
| \`license.manage\` | Cấp & quản lý license |
| \`finance.view\` | Xem tài chính/doanh thu |
| \`marketing.view\` | Xem marketing + blog |
| \`affiliate.manage\` | Quản lý affiliate |
| \`admins.manage\` | Quản lý admin khác |

Gán quyền cho từng admin tại mục này. Sidebar tự ẩn/hiện theo quyền.

*Quyền:* super_admin.`,
  },
];
