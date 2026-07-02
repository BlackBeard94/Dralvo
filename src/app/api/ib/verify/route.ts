import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

// GTC — Dralvo's exclusive IB partner
const IB_LINKS: Record<string, string> = {
  "gtc-usd": "https://web.mygtc.app/login/register?ref=hc8B8eNC",
  "gtc-cent": "https://web.mygtc.app/login/register?ref=ADWMQMDP",
};

const DOWNLOADS = {
  ex5: "/downloads/tigold/Dralvo TiGold.ex5",
  set: "/downloads/tigold/Dralvo tigold v1.set",
  guide: "/downloads/tigold/Huong_dan_su_dung.html",
};

// GTC has no public API, so account ownership cannot be proven here. This
// endpoint therefore only shape-validates and hands out the (freely
// downloadable) files. The LICENSE itself is issued through the Telegram
// approval flow: customer talks to @dralvo_bot → owner verifies the account +
// min deposit in the GTC IB portal → one-tap approve → key is granted via
// /api/agent/ops/license-approve. The EA refuses to trade without that key.
function isValidAccount(account: string): boolean {
  return /^\d{6,10}$/.test(account);
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "ib:verify"),
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const { account, broker } = (await request.json().catch(() => ({}))) as {
    account?: string;
    broker?: string;
  };

  if (!account || !broker) {
    return NextResponse.json(
      { verified: false, error: "Vui lòng nhập số tài khoản và chọn broker." },
      { status: 400 },
    );
  }

  const ibLink = IB_LINKS[broker.toLowerCase()];
  if (!ibLink) {
    return NextResponse.json(
      { verified: false, error: "Broker chưa được hỗ trợ IB. Vui lòng chọn broker khác." },
      { status: 400 },
    );
  }

  if (!isValidAccount(account)) {
    return NextResponse.json(
      { verified: false, error: "Số tài khoản không hợp lệ (6-10 chữ số)." },
      { status: 400 },
    );
  }

  // No license key here (see note above) — downloads only, plus a pointer to
  // the Telegram activation flow.
  return NextResponse.json({
    verified: true,
    downloads: DOWNLOADS,
    activation: {
      how: "telegram",
      bot: "https://t.me/dralvo_bot?start=tigold",
      note: "Nhắn bot Telegram của Dralvo để kích hoạt license (miễn phí, cần tài khoản mở qua IB Dralvo và nạp tối thiểu $50 / 5.000 cent).",
    },
  });
}
