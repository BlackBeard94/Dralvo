# Dralvo — Positioning (single source of truth)

> Chốt 2026-07-02 bởi chủ dự án. **Mọi copy/marketing/app phải bám định vị này.**
> Nếu thấy chỗ nào nói khác (vd "Gold Decision Intelligence") → đó là bản cũ, cần sửa (xem §8).

## 1. Định vị 1 câu
**Dralvo là kho robot giao dịch vàng XAUUSD tự động (EA) cho MetaTrader 5 — mỗi robot minh bạch bằng chính bộ backtest đã kiểm chứng.**

- **Category**: EA store / marketplace robot vàng (không phải 1 sản phẩm lẻ — là *kho nhiều EA*).
- **Tagline**: **Drill into gold.** · **No fake data.**

## 2. Dralvo LÀ gì / KHÔNG là gì
| LÀ | KHÔNG phải |
|---|---|
| Kho/cửa hàng **robot EA** (TiGold free + VIP GoldScalp/GoldMaster + mở rộng) | Không phải dịch vụ **tín hiệu mua/bán** |
| **Công cụ** giao dịch tự động trên MT5 | Không phải **lời khuyên tài chính / uỷ thác vốn** |
| Minh bạch backtest (drawdown, tháng thua) | Không phải sản phẩm **"phân tích/thesis vàng"** (định vị cũ trong app) |
| Vàng XAUUSD chuyên biệt | Không hứa "100%/tháng", "làm giàu nhanh" |

## 3. Messaging pillars (4)
1. **Kho EA, không phải 1 con** — nhiều robot cho nhiều khẩu vị rủi ro; có bản **FREE** (TiGold) để thử.
2. **No Fake Data** — mỗi EA công khai đúng bộ backtest (Net, PF, **Max DD**, tháng thua). Bán bằng sự thật.
3. **Kỷ luật & minh bạch** — không martingale/grid; nêu rõ rủi ro.
4. **Chuyên vàng, chạy MT5** — XAUUSD, tick thật, cài đặt sẵn preset.

## 4. Audience & thị trường
Trader bán lẻ (mới → trung cấp) muốn tự động hoá giao dịch vàng, đã chán các nhóm EA "phét".
Thị trường: 🇻🇳 vi (sân nhà) · 🇬🇧 en (quốc tế) · 🇦🇪🇸🇦🇶🇦 ar (Vùng Vịnh, RTL) · 🇧🇷 pt-BR.

## 5. One-liner + CTA theo ngôn ngữ
| Locale | One-liner | CTA chính |
|---|---|---|
| vi | Kho robot giao dịch vàng XAUUSD tự động cho MT5 — minh bạch backtest. | Nhận TiGold miễn phí |
| en | An EA store of automated XAUUSD gold trading robots for MT5 — backtests you can verify. | Get TiGold free |
| ar | متجر روبوتات تداول الذهب XAUUSD الآلية لمنصّة MT5 — نتائج باكتست يمكنك التحقق منها. | احصل على TiGold مجانًا |
| pt-BR | Uma loja de robôs de trading de ouro XAUUSD para MT5 — com backtests que você pode verificar. | Baixe o TiGold grátis |

## 6. Kiến trúc sản phẩm / tên gọi
- **Kho EA** (marketplace) = "Dralvo EA Store" / "Kho robot Dralvo".
- Robot: **TiGold** (M1, FREE) · **GoldScalp** (M15, VIP) · **GoldMaster** (D1, VIP) · (mở rộng thêm).
- Gói VIP: $59/tháng · $319/6 tháng · $599/năm (mở khoá kho VIP).

## 7. Compliance (giữ nguyên khung "công cụ, không phải lời khuyên")
Dù bán EA, disclaimer "**Dralvo là công cụ, không phải lời khuyên tài chính; backtest quá khứ không bảo đảm tương lai; giao dịch có rủi ro**" VẪN đúng và bắt buộc. Chi tiết theo vùng: [`DISCLAIMERS.md`](DISCLAIMERS.md).

## 8. Trạng thái app (đã kiểm site render thật)
Live app `dralvo-landing` **ĐÃ đúng định vị EA**: homepage title "Automated XAUUSD Gold Trading Robots for MT5", hero "Hai cỗ máy… Thuê robot bắt đầu hôm nay", và **`dashboard/kho/` = Kho EA hoàn chỉnh** (VIP-gated, tải EA/set file/hướng dẫn từ `vault_eas`). Lớp `thesis/drivers/correlation/cftc` trong dashboard là **phân tích thị trường HỖ TRỢ** cho EA (cái "vì sao"), không phải sản phẩm khác.

**Chỉ còn 1 chỗ copy cũ**: trang **`/methodology`** (dùng `PRODUCT_COPY` với chữ "Gold Decision Intelligence / gold thesis") — nên rà lại xem có cần đổi giọng cho khớp "kho EA + phân tích hỗ trợ" hay không (trang này có thể đang mô tả *phương pháp phân tích đằng sau EA*, không hẳn sai). `TRACK_RECORD_COPY` (/track-record) hợp định vị EA (backtest) — giữ.
