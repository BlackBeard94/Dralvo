# Dralvo — Brand Identity System

> Bộ nhận diện thương hiệu Dralvo. Nguồn chuẩn (source of truth) cho logo, màu,
> chữ và giọng điệu. Mọi asset raster được **sinh tự động** từ file vector — đừng
> chỉnh tay file PNG. Sửa vector → chạy lại generator.

---

## 1. Bản chất thương hiệu

| | |
|---|---|
| **Tên** | Dralvo |
| **Ngành** | Robot giao dịch vàng XAUUSD tự động (EA) cho MetaTrader 5 |
| **Concept** | **Drill into gold** — khoan sâu, chính xác, chạm tới vàng thật |
| **Triết lý** | **No Fake Data** — mỗi robot marketing bằng chính bộ backtest đã kiểm chứng, công khai cả drawdown và tháng thua |
| **Tính cách** | Minh bạch · kỷ luật · chính xác · không hứa hẹn viển vông |
| **Ngôn ngữ** | Tiếng Việt (chính), tiếng Anh (phụ) |

Định hướng thị giác: **vàng ánh kim cao cấp trên nền tối** — sang, "đắt", đúng
chất giao dịch vàng. Thông điệp "No Fake Data" thể hiện ở **nội dung/giọng điệu**
(công khai backtest, drawdown), không phải ở việc làm logo tối giản.

---

## 2. Logo

> Logo chính thức là **file ảnh do chủ dự án cung cấp** (art vàng 3D). Nguồn:
> `public/brand/official/`. Mọi asset phái sinh sinh tự động từ đây, **không vẽ lại**.

### 2.1 Cấu tạo
- **Mark (biểu tượng)** — **monogram "DA" vàng ánh kim 3D**: chữ D và A lồng nhau,
  bên trong D có **cụm nến tăng dần**, một **mũi tên đi lên** xuyên qua A. Đây là
  biểu tượng thương hiệu, dùng cho app icon / avatar / favicon.
- **Wordmark** — **DRALVO** chữ hoa (font trong art gốc), thường đi kèm mark thành
  **lockup ngang**.
- **Biến thể màu**: vàng (nền tối) · trắng (nền tối/ảnh) · đen (nền sáng/in).

### 2.2 File nguồn & phái sinh
**Nguồn (`public/brand/official/`)** — không sửa tay:
| File | Vai trò |
|---|---|
| `dralvo-monogram.png` | Monogram DA vàng (nền trong) — nguồn icon/favicon |
| `dralvo-lockup-gold.png` | Lockup ngang vàng (nền trong) — nền tối |
| `dralvo-lockup-white.png` | Lockup ngang trắng — nền tối/ảnh |
| `dralvo-lockup-black.png` | Lockup ngang đen — nền sáng/in |
| `dralvo-avatar-vip.png` | Huy hiệu VIP (vương miện + nguyệt quế) |
| `dralvo-avatar-telegram.png` | Avatar tròn (DA trong vòng) |

**Phái sinh (`public/brand/`, sinh bởi `scripts/gen-brand-assets.mjs`)**: `dralvo-mark-512`,
`dralvo-icon-32/48/180/192/512`, `favicon.ico` + `public/favicon.svg`, `dralvo-og`
(1200×630), `dralvo-logo-dark/light/white`, `dralvo-hero-logo`, `dralvo-avatar-*` (512²).

### 2.3 Clear space & kích thước tối thiểu
- **Clear space**: chừa quanh logo tối thiểu = chiều cao chữ **D** trong logo.
- **Min size**: monogram ≥ **32 px**; lockup ngang ≥ **160 px** rộng.
- ⚠️ Dưới ~32px monogram bị nhoè (nến + DA lồng nhau) → **cần bản mark rút gọn 1 chữ**
  cho favicon 16px (gap chưa xử lý — xem §Gaps).

### 2.4 KHÔNG được (misuse)
- ❌ Không xoay, nghiêng, bóp méo tỉ lệ logo.
- ❌ Không đổi bảng màu vàng của logo sang màu khác.
- ❌ Không đặt lockup vàng lên nền vàng/nền ảnh rối → dùng bản trắng hoặc đen.
- ❌ Không tự vẽ lại monogram — dùng file nguồn trong `official/`.

### 2.5 Vector masters ✅ (traced 2026-07-02)
Đã trace logo raster → **vector scale vô hạn** (in khổ lớn/thêu/khắc), trong `public/brand/svg/`:
| File | Dùng cho |
|---|---|
| `dralvo-mark-vector.svg` | Monogram 1 màu (`currentColor`) — in/khắc/watermark |
| `dralvo-mark-gold.svg` | Monogram đổ vàng gradient phẳng |
| `dralvo-logo-vector.svg` / `-gold.svg` | **Full lockup** (DA+DRALVO) 1 màu / vàng |
| `dralvo-favicon-mark.svg` | Phần chữ D — mark rút gọn cho favicon cỡ nhỏ |

Sinh bởi `scripts/gen-brand-vector.mjs` (dùng `potrace`). Lưu ý: đây là **vector từ silhouette**
(chính xác hình dạng, phẳng màu) — KHÔNG phải bản 3D bóng photoreal như art gốc; để hiệu ứng ánh
kim 3D vẫn dùng file raster trong `official/`.

### 2.6 Gaps còn lại
- **Font wordmark chưa xác định** → cần nhận diện/mua để đồng bộ Typography (§4).
- Favicon 16px dùng `dralvo-favicon-mark.svg` (phần D) — có thể tinh chỉnh crop cho gọn hơn.

---

## 3. Màu sắc

Hệ màu **gold-on-dark** kiểu Binance. Giá trị thật là các CSS variable trong
`src/app/globals.css` (dark là mặc định, có bộ light riêng). HEX dưới đây là dark theme.

### 3.1 Nền & chữ
| Vai trò | Token | HEX |
|---|---|---|
| Nền sâu (page) | `--bg-deep` | `#0B0E11` |
| Nền nổi (surface) | `--bg-surface` | `#181A20` |
| Thẻ (card) | `--bg-card` | `#1E2329` |
| Đường viền | `--bg-border` | `#2B3139` |
| Chữ chính | `--text-primary` | `#EAECEF` |
| Chữ phụ | `--text-secondary` | `#848E9C` |
| Chữ mờ | `--text-muted` | `#5E6673` |

### 3.2 Vàng thương hiệu
| Vai trò | Token | HEX | Ghi chú |
|---|---|---|---|
| Vàng chính | `--gold-primary` | `#F0B90B` | Màu ký hiệu chủ đạo, nút CTA |
| Vàng sáng | `--gold-bright` | `#FCD535` | Highlight, hover, mặt sáng facet |
| Vàng nhạt | `--gold-pale` | `#C99A08` | Mặt tối facet, chữ vàng nhỏ |
| Vàng trầm | `--gold-dim` | `#8B6914` | Viền, trạng thái mờ |

> **Light theme**: chữ/icon vàng phải đậm hơn để đọc rõ trên nền trắng —
> `#9A7400` / `#B8860B` (xem `[data-theme="light"]` trong `globals.css`). Mark bản
> light dùng đúng 2 tông này.

### 3.3 Ngữ nghĩa giao dịch
| Vai trò | HEX (dark) | HEX (light) |
|---|---|---|
| Long / lãi / lệnh mua | `#0ECB81` | `#2EBD85` |
| Short / lỗ / lệnh bán | `#F6465D` | `#F6465D` |

⚠️ Xanh/đỏ **chỉ** dùng cho dữ liệu giao dịch (P&L, nến, hướng lệnh), không dùng
làm màu UI trang trí.

---

## 4. Typography

| Vai trò | Font | Dùng cho |
|---|---|---|
| Display / UI / wordmark | **Inter** (400/500/600/700) | Tiêu đề, nội dung, nút, wordmark |
| Data / số / mono | **JetBrains Mono** (400/500/600) | Con số, giá, %, tham số, code |

- Wordmark: Inter **700**, in hoa, `letter-spacing: 0.12em`.
- Mọi **con số** (giá, %, DD, PF, R:R) đặt bằng JetBrains Mono để canh cột thẳng
  hàng và tạo cảm giác "terminal/dữ liệu thật".
- Sentence case cho câu chữ thường; chỉ wordmark và nhãn kỹ thuật ngắn dùng in hoa.

---

## 5. Giọng điệu (Voice & Tone)

**Thẳng thắn, có kỷ luật, không thổi phồng.** Bán bằng sự thật, không bằng lời hứa.

- ✅ Nêu số kèm ngữ cảnh rủi ro: *"Net +139%, PF 1.89, **Max DD 18.8%**, có năm chỉ +9.9%."*
- ✅ Luôn kèm disclaimer: *"Backtest quá khứ, không bảo đảm kết quả tương lai. Giao dịch có rủi ro mất vốn."*
- ✅ Dralvo cung cấp **công cụ**, không phải lời khuyên tài chính.
- ❌ Không "100%/tháng", "robot thần thánh", "làm giàu nhanh", "không bao giờ thua".
- ❌ Không giấu drawdown / tháng thua.

Tagline: **"Drill into gold."** · Câu định vị: **"No fake data."**

---

## 6. Ứng dụng & file index

Asset raster (sinh tự động) trong `public/brand/`:

| File | Kích thước | Dùng ở |
|---|---|---|
| `dralvo-mark-512.png` | 512² | Logo nav (bo góc 22% qua CSS `LogoMark`) |
| `dralvo-icon-512.png` `-192.png` | maskable | PWA manifest |
| `dralvo-icon-180.png` | 180² | Apple touch icon |
| `dralvo-icon-48.png` `-32.png` | favicon | `<link icon>` |
| `favicon.ico` | 16/32/48 | Tab trình duyệt |
| `dralvo-og.png` | 1200×630 | OpenGraph / Twitter card |
| `dralvo-logo-dark.png` / `-light.png` | 936×264 | Lockup PNG cho đối tác/nhúng |
| `dralvo-hero-logo.png` | 1248×352 | Banner hero/nền tối |

Các điểm code tiêu thụ asset: `src/app/layout.tsx` (icons/OG), `src/app/manifest.ts`
(PWA), `src/components/shared/brand.tsx` (`LogoMark` + `DralvoWordmark`).

---

## 7. Tái tạo asset

```bash
node scripts/gen-brand-assets.mjs     # icon/favicon/OG/lockup/avatar từ official/
node scripts/gen-brand-social.mjs     # social + marketing kit (4 ngôn ngữ)
node scripts/gen-brand-vector.mjs     # trace vector masters từ official/ (cần devDep potrace)
```

Đổi logo → thay file trong `public/brand/official/` (giữ tên) rồi chạy lại 2 lệnh trên.
Bản thử nghiệm cũ lưu ở `public/brand/_legacy/` và `_legacy2/` — không dùng.

---

## 8. Brand Kit (Phase 2–10)

Hệ nhận diện đầy đủ, phục vụ tại `/(public)/brand/*`. Mọi trang dùng chung design-system
`public/brand/kit/brand.css` (token màu + typography + component).

| Phase | Deliverable | File |
|---|---|---|
| 2 Color · 3 Type · 5 Components | Design-system CSS | `public/brand/kit/brand.css` |
| 4 | Brand Guideline (logo/màu/chữ/voice/compliance) | `public/brand/guideline.html` |
| 5 | Website UI Kit | `public/brand/ui-kit.html` |
| 6 | Dashboard UI | `public/brand/dashboard.html` |
| 7 | Social Media Kit | `public/brand/social/*.png` |
| 8 | Marketing Kit (ads/email) | `public/brand/marketing/*.png` |
| 9 | Motion Identity | `public/brand/motion.html` |
| 10 | Landing Page | `public/brand/landing.html` |
| — | Hub / index | `public/brand/index.html` |

Xem tại: `/brand/index.html` (khi chạy `npm run dev`).

**Token chính** (xem đầy đủ trong `kit/brand.css`): gold ramp `--gold-100..900` (primary
`--gold-400 #F0B90B`, bright `#FCD535`), neutral `--deep #0B0E11 … --text #EAECEF`,
semantic `--long #0ECB81` / `--short #F6465D`. Fonts: `--font-display` Playfair Display
(luxe headings) · `--font-ui` Inter · `--font-mono` JetBrains Mono (số liệu).

---

## 9. Đa ngôn ngữ (i18n)

**Thị trường mục tiêu**: 🇻🇳 vi · 🇬🇧/quốc tế en · 🇦🇪🇸🇦🇶🇦 ar (Ả-Rập Vịnh, **RTL**) · 🇧🇷 pt (Brazil).

- **Lõi trung tính (không đổi theo ngôn ngữ)**: logo, màu, icon/favicon, motion, token.
- **Lớp bản địa hoá**:
  - Chuỗi: `public/brand/locales/{vi,en,ar,pt}.json` (nguồn cho ảnh + web).
  - Ảnh social/marketing: `public/brand/{social,marketing}/{vi,en,ar,pt}/` — sinh bởi
    `scripts/gen-brand-social.mjs` (đọc locale JSON, tự xử lý **RTL** cho Arabic).
  - Web: `landing.html` có bộ chuyển ngôn ngữ (VI/EN/ع/PT) → đổi `dir`, swap font, đổi chuỗi.
- **Font theo chữ viết**: Latin (vi/en/pt) = Inter/Playfair/JetBrains; **Arabic** = Cairo/Tajawal
  (UI) + Aref Ruqaa (display), số vẫn dùng chữ số Latin (chuẩn tài chính Vùng Vịnh).
- **RTL**: Arabic lật layout — logo sang phải, chữ căn phải, nút đổi bên. `dir="rtl"` trên `<html>`.
- **Định dạng số**: pt-BR dùng dấu phẩy thập phân (`1.234,56`) — đã áp trong chuỗi pt.
- **Pháp lý**: xem [`docs/DISCLAIMERS.md`](DISCLAIMERS.md) — disclaimer 4 ngôn ngữ + lưu ý
  theo cơ quan quản lý (SCA/CMA/QFMA/CVM/SSC). ⚠️ **Bản nháp, cần luật sư địa phương duyệt.**
- **Wordmark "DRALVO" giữ nguyên chữ Latin** ở mọi thị trường (chưa làm bản lockup Ả-Rập — future).
