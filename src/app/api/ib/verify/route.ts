import { NextResponse } from "next/server";

// GTC — Dralvo's exclusive IB partner
const IB_LINKS: Record<string, string> = {
  "gtc-usd": "https://web.mygtc.app/login/register?ref=hc8B8eNC",
  "gtc-cent": "https://web.mygtc.app/login/register?ref=ADWMQMDP",
};

// Mock: any 6-10 digit account number passes for now.
// Replace with real broker API verification when IB is live.
function isValidAccount(account: string): boolean {
  return /^\d{6,10}$/.test(account);
}

export async function POST(request: Request) {
  const { account, broker } = (await request.json()) as {
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

  // TODO: real IB verification — check with broker API that this account
  // was registered under Dralvo's IB link.

  return NextResponse.json({
    verified: true,
    downloads: {
      ex5: "/downloads/tigold/Dralvo TiGold.ex5",
      set: "/downloads/tigold/Dralvo tigold v1.set",
      guide: "/downloads/tigold/Huong_dan_su_dung.html",
    },
  });
}
