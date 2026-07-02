# Blog Agent API — cho agent tự viết & đăng bài (Paperclip, v.v.)

> Cho phép agent bên ngoài **viết + đăng bài blog** qua HTTP, không cần đăng nhập
> cookie. Xác thực bằng **API key** (Bearer). Tối ưu sẵn cho SEO + GEO.

## 1. Cấu hình (env)
Đặt trên production (Vercel → Project → Settings → Environment Variables) và local:
```
BLOG_AGENT_API_KEY=<chuỗi bí mật dài, giữ kín>
BLOG_AGENT_ALLOW_PUBLISH=false      # false = agent chỉ tạo NHÁP (bạn duyệt rồi đăng)
                                    # true  = agent đăng thẳng
```
> Khuyến nghị để `false` lúc đầu: agent viết → nháp → bạn xem `/admin` → Blog → đăng.
> Khi tin tưởng chất lượng agent thì bật `true` để auto-publish.

## 2. Endpoint
Base: `https://www.dralvo.com/api/agent/blog`
Header bắt buộc: `Authorization: Bearer <BLOG_AGENT_API_KEY>`

| Call | Ý nghĩa |
|---|---|
| `GET ?action=guidelines` | Trả **hợp đồng nội dung + luật SEO/GEO + danh sách slug đã có** (agent đọc để tự định hướng, tránh trùng). |
| `GET` (hoặc `?action=list`) | Liệt kê bài hiện có (slug, locale, status, url). |
| `POST` | Tạo/cập nhật 1 bài (idempotent theo `slug`+`locale`). |

## 3. Body của POST (hợp đồng nội dung)
```json
{
  "slug": "kebab-case-english-slug",     // giữ NGUYÊN qua các bản dịch
  "locale": "en",                          // vi | en | pt-BR | es | id | ar
  "title": "≤60 ký tự, chứa từ khóa chính",
  "excerpt": "TL;DR 1-2 câu trả lời thẳng câu hỏi (GEO trích cái này)",
  "body": "Markdown: ## H2, ### H3, đoạn ngắn, list, tối đa 1 bảng",
  "tags": ["XAUUSD","MT5","gold EA"],
  "meta_title": "SEO title ≤60",
  "meta_description": "150-160 ký tự",
  "faq": [{"q":"...","a":"..."}],          // 3-6 Q&A → FAQPage schema (rất mạnh cho GEO)
  "status": "published"                    // bị ép 'draft' nếu ALLOW_PUBLISH != true
}
```
Server tự: slugify, tính thời gian đọc, sanitize HTML khi render, tạo hreflang/sitemap/JSON-LD.

## 4. Vòng lặp khuyến nghị cho agent
1. `GET /api/agent/blog?action=guidelines` → lấy luật + `existing` (slug đã có) + `internal_links` + `example_topics`.
2. `GET https://www.dralvo.com/llms.txt` → lấy **sự thật sản phẩm** (sản phẩm, giá, điểm khác biệt). **Không bịa số.**
3. Chọn 1 chủ đề chưa có trong `existing`.
4. Viết JSON theo hợp đồng (theo `structure_rules` + `geo_rules`): mở bài bằng TL;DR, H2/H3, chèn 2-4 internal link, kết bằng FAQ 3-6 câu.
5. `POST` bài (locale chính, vd `en`).
6. Dịch: `POST` lại **cùng slug** với `locale` khác (vi, pt-BR, ...). Bản dịch tự liên kết hreflang.

## 5. Ví dụ (curl)
```bash
KEY=... # BLOG_AGENT_API_KEY
# Lấy luật + slug đã có
curl -H "Authorization: Bearer $KEY" \
  "https://www.dralvo.com/api/agent/blog?action=guidelines"

# Đăng 1 bài
curl -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d @article.json "https://www.dralvo.com/api/agent/blog"
```

## 6. Prompt gợi ý cho agent Paperclip (dán vào instructions)
> Bạn là biên tập viên SEO/GEO của Dralvo (robot giao dịch vàng XAUUSD cho MT5).
> Trước khi viết: GET `/api/agent/blog?action=guidelines` và GET `/llms.txt`.
> Tuân thủ `structure_rules`, `seo_rules`, `geo_rules`, `eeat_and_safety` trong guidelines.
> Chỉ dùng sự thật từ `/llms.txt` — không bịa số liệu/lợi nhuận. Không tư vấn tài chính.
> Mỗi bài: TL;DR ở đầu, H2/H3 rõ ràng, 2-4 internal link, FAQ 3-6 câu.
> Đăng bằng POST; sau đó POST bản dịch cùng slug cho các `locale` khác.

## 7. Bảo mật
- Giữ `BLOG_AGENT_API_KEY` bí mật; rotate định kỳ. Endpoint fail-closed nếu key chưa set.
- Rate limit 30 POST/phút/IP. Body < 200 ký tự bị từ chối.
- Để `ALLOW_PUBLISH=false` nếu muốn người duyệt trước khi bài lên public.
