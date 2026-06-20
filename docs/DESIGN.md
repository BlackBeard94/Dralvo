# Dralvo — DESIGN.md

> Hệ design system cho Dralvo Capital (robot giao dịch vàng). Tông "phòng kiểm
> định vàng × terminal tài chính": tối, sang, kỷ luật, đáng tin. SaaS-grade.
> Inspired-by tinh thần fintech cao cấp (Stripe/Linear-độ sạch) + bản sắc vàng riêng.

## 1. Overview
Sản phẩm: 2 EA vàng bán theo gói thuê (SaaS). Người dùng: trader vàng hoài nghi
EA scam. Mục tiêu trang: tạo niềm tin bằng số liệu kiểm chứng + chuyển đổi sang
dùng thử/đăng ký. Cảm giác: chính xác, minh bạch, cao cấp — KHÔNG "kèo thơm".

## 2. Color (dark-first)
- `--bg-deep` #0b0b09 · `--bg-surface` #121109 · `--bg-card` #16150d
- `--border` rgba(212,168,67,.14) — viền ám vàng mảnh
- Gold: `--gold` #d4a92d · `--gold-bright` #f0cf5a (accent chính, dùng TIẾT CHẾ)
- Steel (EA Scalp / phụ): #5aa9e6 / #7dc0f0
- Semantic: profit `--green` #46c46a · loss `--red` #e1604a
- Text: primary #ece7d6 · secondary #c4bda8 · muted #8f8a76
- Quy tắc: 1 accent nổi bật/khu vực. Vàng cho nhấn mạnh & số liệu, không tô tràn.

## 3. Typography
- Display: **DM Serif Display** (tiêu đề lớn — uy tín, "chứng chỉ"). Dùng cho h1/h2.
- Body/UI: **Inter** (400/500/600).
- Data/numbers: **monospace** (ui-monospace) — mọi con số = "số liệu đã chứng thực".
- Scale: h1 clamp(2.4rem,5vw,4rem)/1.04 · h2 2–3rem · body 15–18px · caption 11–13px.
- Tracking: tiêu đề -0.02em; eyebrow/label uppercase +0.16em.

## 4. Spacing & Layout
- Max width 1180px nội dung, 1100 cho lưới sản phẩm. Section padding y: 80–112px.
- Lưới 12-col tinh thần; section luân phiên `bg-deep` ↔ `bg-surface` tạo nhịp.
- Radius: card 16px (rounded-2xl), control 8px, pill full. Hairline 1px viền vàng.
- Khoảng trắng rộng rãi — sang trọng đến từ "ít nhưng chuẩn".

## 5. Components
- **Card sản phẩm (assay plate):** viền accent mảnh + glow nhẹ dưới + hallmark góc
  (.999.9) + KPI mono. Gold cho GoldMaster, Steel cho Scalp.
- **KPI tile:** số mono lớn (màu semantic), label uppercase muted nhỏ.
- **Button:** primary = nền gold-bright chữ #060609; secondary = viền border, hover gold.
- **Tab/Toggle:** pill nền card, active = nền accent chữ tối.
- **Bảng số liệu:** mono, hàng nổi bật = nền accent .07, header uppercase muted.
- **Accordion FAQ:** group theo chủ đề, mở mượt, + → ×.

## 6. Motion
- Reveal khi cuộn (fade+rise 8px), 500–700ms ease-out. Hover scale 1.02–1.03.
- Tôn trọng `prefers-reduced-motion`. Không animation thừa.

## 7. Do's & Don'ts
- ✅ Số liệu là anh hùng; trình bày như bảng kiểm định. ✅ Dùng vàng tiết chế.
- ✅ Ngôn ngữ minh bạch, chuyên nghiệp. ✅ Khoảng trắng rộng.
- ❌ KHÔNG lộ logic bot (chỉ báo, công thức, SL/TP cụ thể, khung lọc).
- ❌ KHÔNG nhồi disclaimer/“past performance” dày đặc trên UI bán hàng.
- ❌ KHÔNG gradient lòe loẹt, không emoji rải rác, không "kèo thơm".

## 8. Responsive
- Mobile-first: lưới sản phẩm 1 cột; KPI 2 cột; nav gọn. Tap target ≥44px.
- Equity curve & bảng cuộn ngang an toàn trên mobile.

## 9. Voice
- Tự tin, điềm tĩnh, dữ kiện. "Chiến lược đã kiểm chứng trên dữ liệu thật."
- Nói lợi ích & độ tin, KHÔNG mô tả cơ chế vận hành EA. Active voice, sentence case.
