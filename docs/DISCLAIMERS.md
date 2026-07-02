# Dralvo — Disclaimers & Compliance (i18n)

> ⚠️ **BẢN NHÁP — KHÔNG PHẢI TƯ VẤN PHÁP LÝ.** Toàn bộ nội dung dưới đây là bản
> dịch/khởi thảo để nhất quán thương hiệu. **Trước khi phát hành ở mỗi thị trường,
> BẮT BUỘC nhờ luật sư/đơn vị tuân thủ địa phương rà soát** — quảng cáo tài chính và
> việc chào bán "robot/EA" bị quản lý chặt và khác nhau theo từng nước.

## 1. Risk disclaimer (dùng dưới mọi ấn phẩm có số liệu)

| Locale | Text |
|---|---|
| **vi** | Dralvo cung cấp công cụ giao dịch, **không phải lời khuyên tài chính**. Mọi số liệu là kết quả backtest quá khứ, **không bảo đảm kết quả tương lai**. Giao dịch có rủi ro mất vốn. |
| **en** | Dralvo provides trading tools, **not financial advice**. All figures are past backtest results and **do not guarantee future results**. Trading involves risk of loss. |
| **ar** | تقدّم درالفو أدوات تداول، **وليست نصيحة مالية**. جميع الأرقام نتائج اختبار سابقة **ولا تضمن نتائج مستقبلية**. ينطوي التداول على مخاطر الخسارة. |
| **pt-BR** | A Dralvo fornece ferramentas de trading, **não consultoria financeira**. Todos os números são resultados de backtest passados e **não garantem resultados futuros**. Operar envolve risco de perda. |

(Bản trong sản phẩm: `public/brand/locales/*.json → disclaimer`; landing: biến `L[loc].disclaimer`.)

## 2. Lưu ý theo thị trường (cần review chuyên sâu)

### 🇦🇪 UAE (AE) — quản lý bởi **SCA** (Securities & Commodities Authority) / VARA (Dubai)
- Chào bán công cụ giao dịch / tín hiệu / copy-trade **có thể cần giấy phép**. Kiểm tra trước.
- Quảng cáo tài chính phải rõ ràng, không gây hiểu nhầm, nêu rủi ro.
- **Tài chính Hồi giáo**: cân nhắc tài khoản **swap-free (không riba)**; tránh ngôn từ gợi "bảo đảm lợi nhuận" (gharar/maysir). Có thể cần bản **tiếng Ả-Rập** cho quảng cáo.

### 🇸🇦 Saudi Arabia (SA) — quản lý bởi **CMA** (Capital Market Authority)
- Quy định **rất chặt** với sản phẩm/khuyến nghị đầu tư; nội dung tiếp thị tài chính bị giám sát.
- Ưu tiên/bắt buộc **tiếng Ả-Rập**; kỳ vọng phù hợp **Sharia**.
- Tránh mọi tuyên bố "làm giàu", "bảo đảm", "không rủi ro".

### 🇶🇦 Qatar (QA) — **QFMA** (onshore) / **QFCRA** (QFC)
- Chào bán/quảng bá dịch vụ tài chính cho cư dân có thể cần đăng ký. Rà soát trước khi chạy ads.
- Yêu cầu ngôn ngữ + disclaimer tương tự Vịnh.

### 🇧🇷 Brazil (pt-BR) — quản lý bởi **CVM** (Comissão de Valores Mobiliários)
- CVM siết nội dung của **"influenciadores"/quảng cáo đầu tư**: không hứa lợi nhuận, không trình bày như tư vấn đầu tư nếu không được cấp phép, phải công bố quan hệ thương mại.
- **Bắt buộc tiếng Bồ Đào Nha**; định dạng số theo pt-BR (`1.234,56`).

### 🇻🇳 Việt Nam (vi) — **SSC** (UBCK Nhà nước)
- Giao dịch forex/CFD phái sinh với NĐT cá nhân ở VN **nằm trong vùng xám/hạn chế pháp lý**. Rất cẩn trọng với cách định vị "đầu tư"; nhấn mạnh đây là **công cụ/giáo dục**, không huy động vốn, không nhận uỷ thác.

## 3. Nguyên tắc chung (mọi thị trường)
- ❌ Không "100%/tháng", "bảo đảm", "không rủi ro", "làm giàu nhanh".
- ✅ Luôn hiển thị **drawdown + tháng thua**; nêu "kết quả quá khứ".
- ✅ Ghi rõ **Dralvo = công cụ**, không phải lời khuyên/uỷ thác đầu tư.
- ✅ Cân nhắc **swap-free** cho thị trường Hồi giáo (AE/SA/QA).
- ✅ Mỗi thị trường: **luật sư địa phương duyệt** ads + disclaimer trước khi phát hành.
