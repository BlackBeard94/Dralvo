/**
 * Affiliate program copy — vi + en authored; other locales fall back to en.
 */
import { withLocaleFallback } from "@/lib/i18n";

export const AFFILIATE_COPY = withLocaleFallback({
  vi: {
    // Nav / footer
    navLabel: "Affiliate",

    // Public landing page
    hero: {
      eyebrow: "Affiliate Program",
      title: "Kiếm 30% hoa hồng định kỳ.",
      subtitle:
        "Giới thiệu Dralvo đến cộng đồng của bạn. Mỗi khách hàng bạn mang đến — bạn nhận 30% hoa hồng mỗi tháng họ tiếp tục sử dụng. Không giới hạn, không vòng vo.",
      cta: "Đăng ký làm Affiliate",
      loginCta: "Đã có tài khoản? Xem dashboard",
    },

    // How it works
    how: {
      eyebrow: "Cách hoạt động",
      title: "3 bước đơn giản.",
      steps: [
        { title: "Đăng ký", body: "Tạo tài khoản Dralvo, đăng ký affiliate. Chúng tôi sẽ duyệt trong 24h." },
        { title: "Chia sẻ link", body: "Nhận link referral riêng. Chia sẻ lên blog, YouTube, Telegram, Facebook." },
        { title: "Nhận hoa hồng", body: "Khách mua qua link của bạn → bạn nhận 30% mỗi tháng. Rút khi đạt $50." },
      ],
    },

    // Commission structure
    commission: {
      eyebrow: "Hoa hồng",
      title: "30% trọn đời khách hàng.",
      subtitle: "Mỗi tháng khách renew → bạn nhận 30%. Khách dùng càng lâu, bạn càng lời.",
      items: [
        { label: "Tỷ lệ hoa hồng", value: "30%" },
        { label: "Cookie", value: "30 ngày" },
        { label: "Rút tối thiểu", value: "$50" },
        { label: "Mô hình", value: "Recurring" },
      ],
    },

    // Why partner
    why: {
      eyebrow: "Tại sao làm affiliate",
      title: "Sản phẩm thật, số thật.",
      items: [
        { title: "Sản phẩm đã kiểm chứng", body: "EA được backtest trên dữ liệu thật 10 năm. Không phải 'bot ma' — khách hàng thấy được kết quả." },
        { title: "Hoa hồng minh bạch", body: "Dashboard real-time: click, conversion, earnings. Không delay, không ẩn số." },
        { title: "Hỗ trợ tận răng", body: "Có Telegram riêng cho affiliate. Hỗ trợ content, banner, landing page." },
        { title: "Thanh toán đúng hạn", body: "Rút qua Sepay/chuyển khoản. Tự request payout khi đạt $50." },
      ],
    },

    // CTA
    cta: {
      eyebrow: "Sẵn sàng?",
      title: "Bắt đầu kiếm hoa hồng hôm nay.",
      body: "Không cần vốn, không cần kinh nghiệm. Chỉ cần bạn có cộng đồng quan tâm đến trading vàng.",
      button: "Đăng ký ngay",
    },

    // FAQ
    faq: {
      eyebrow: "FAQ",
      title: "Mọi thứ bạn cần biết.",
      items: [
        ["Ai có thể làm affiliate?", "Bất kỳ ai — trader, blogger, YouTuber, admin group Telegram/Facebook. Chỉ cần bạn có cộng đồng quan tâm đến forex/vàng."],
        ["Làm sao để nhận hoa hồng?", "Khách mua Dralvo Unlimited qua link của bạn → bạn nhận 30% giá trị đơn hàng. Mỗi tháng khách renew → bạn nhận tiếp 30%."],
        ["Khi nào được rút tiền?", "Khi tổng hoa hồng pending đạt $50. Bạn request payout, chúng tôi chuyển khoản trong 3 ngày làm việc."],
        ["Có giới hạn số lượng khách không?", "Không. Càng nhiều khách, càng nhiều hoa hồng. Không có cap."],
        ["Cookie kéo dài bao lâu?", "30 ngày. Nếu khách click link của bạn và mua trong 30 ngày, bạn nhận hoa hồng."],
      ],
    },

    // Affiliate dashboard
    dashboard: {
      title: "Affiliate Dashboard",
      statusPending: "Đang chờ duyệt",
      statusActive: "Đang hoạt động",
      statusSuspended: "Tạm khóa",
      statusRejected: "Từ chối",
      referralLink: "Link referral",
      copyLink: "Copy",
      copied: "Đã copy!",
      stats: {
        clicks: "Click",
        conversions: "Conversion",
        conversionRate: "Tỷ lệ chuyển đổi",
        pendingEarnings: "Hoa hồng chờ",
        totalEarned: "Tổng đã kiếm",
        paidOut: "Đã thanh toán",
        available: "Có thể rút",
      },
      commissions: {
        title: "Lịch sử hoa hồng",
        empty: "Chưa có hoa hồng nào.",
        amount: "Số tiền",
        source: "Đơn gốc",
        status: "Trạng thái",
        date: "Ngày",
        statusPending: "Đang chờ",
        statusPaid: "Đã trả",
        statusCancelled: "Đã hủy",
        statusRefunded: "Hoàn tiền",
      },
      requestPayout: "Request rút tiền",
      notEligible: "Cần đủ $50 để rút",
      notAffiliateTitle: "Bạn chưa là affiliate",
      notAffiliateBody: "Đăng ký ngay để nhận link referral và bắt đầu kiếm 30% hoa hồng từ khách hàng bạn giới thiệu.",
      applyNow: "Đăng ký ngay",
      applying: "Đang đăng ký...",
      howTitle: "Cách hoạt động",
      howSteps: [
        "Đăng ký — admin sẽ duyệt trong 24h",
        "Nhận link referral riêng của bạn",
        "Chia sẻ link — kiếm 30% hoa hồng mỗi tháng",
      ],
      pendingNotice: "Tài khoản affiliate của bạn đang chờ duyệt.",
      pendingNoticeDetail: "Admin sẽ xem xét và phê duyệt trong 24h. Bạn vẫn có thể xem link referral của mình.",
    },

    // Admin panel
    admin: {
      title: "Admin — Affiliate",
      settings: "Cấu hình",
      affiliates: "Affiliates",
      commissions: "Hoa hồng",
      saveSettings: "Lưu cấu hình",
      settingsSaved: "Đã lưu!",
      commissionRate: "Tỷ lệ hoa hồng (%)",
      cookieDays: "Cookie (ngày)",
      minPayout: "Rút tối thiểu ($)",
      programActive: "Kích hoạt chương trình",
      approve: "Duyệt",
      reject: "Từ chối",
      suspend: "Khóa",
      markPaid: "Đánh dấu đã trả",
      noCommissions: "Không có hoa hồng pending.",
      paidSuccess: "Đã đánh dấu.",
    },
  },

  en: {
    navLabel: "Affiliate",

    hero: {
      eyebrow: "Affiliate Program",
      title: "Earn 30% recurring commission.",
      subtitle:
        "Refer Dralvo to your community. Every customer you bring earns you 30% every month they stay. No limits, no games.",
      cta: "Become an Affiliate",
      loginCta: "Already a partner? View dashboard",
    },

    how: {
      eyebrow: "How it works",
      title: "3 simple steps.",
      steps: [
        { title: "Sign up", body: "Create a Dralvo account and apply as an affiliate. We'll approve within 24h." },
        { title: "Share your link", body: "Get your unique referral link. Share it on your blog, YouTube, Telegram, or Facebook." },
        { title: "Earn", body: "Customers buy through your link → you earn 30% every month. Withdraw when you reach $50." },
      ],
    },

    commission: {
      eyebrow: "Commission",
      title: "30% lifetime of customer.",
      subtitle: "Every month the customer renews → you get 30%. The longer they stay, the more you earn.",
      items: [
        { label: "Commission rate", value: "30%" },
        { label: "Cookie window", value: "30 days" },
        { label: "Min payout", value: "$50" },
        { label: "Model", value: "Recurring" },
      ],
    },

    why: {
      eyebrow: "Why partner with us",
      title: "Real product. Real numbers.",
      items: [
        { title: "Verified product", body: "EAs backtested on 10 years of real data. Not ghost bots — customers see real results." },
        { title: "Transparent earnings", body: "Real-time dashboard: clicks, conversions, earnings. No delays, no hidden numbers." },
        { title: "Full support", body: "Dedicated Telegram group for affiliates. Content, banners, landing page support." },
        { title: "On-time payouts", body: "Withdraw via Sepay/bank transfer. Request payout once you hit $50." },
      ],
    },

    cta: {
      eyebrow: "Ready?",
      title: "Start earning today.",
      body: "No capital, no experience needed. Just a community interested in gold trading.",
      button: "Apply now",
    },

    faq: {
      eyebrow: "FAQ",
      title: "Everything you need to know.",
      items: [
        ["Who can become an affiliate?", "Anyone — traders, bloggers, YouTubers, Telegram/Facebook group admins. If you have an audience interested in forex/gold, you're in."],
        ["How do I earn commission?", "A customer buys Dralvo Unlimited through your link → you earn 30% of the order. Every month they renew → you earn another 30%."],
        ["When can I withdraw?", "Once your pending earnings reach $50. Request a payout — we transfer within 3 business days."],
        ["Is there a limit on referrals?", "No. More customers = more commission. No caps."],
        ["How long does the cookie last?", "30 days. If a customer clicks your link and purchases within 30 days, you get the commission."],
      ],
    },

    dashboard: {
      title: "Affiliate Dashboard",
      statusPending: "Pending approval",
      statusActive: "Active",
      statusSuspended: "Suspended",
      statusRejected: "Rejected",
      referralLink: "Your referral link",
      copyLink: "Copy",
      copied: "Copied!",
      stats: {
        clicks: "Clicks",
        conversions: "Conversions",
        conversionRate: "Conversion rate",
        pendingEarnings: "Pending earnings",
        totalEarned: "Total earned",
        paidOut: "Paid out",
        available: "Available",
      },
      commissions: {
        title: "Commission history",
        empty: "No commissions yet.",
        amount: "Amount",
        source: "Order",
        status: "Status",
        date: "Date",
        statusPending: "Pending",
        statusPaid: "Paid",
        statusCancelled: "Cancelled",
        statusRefunded: "Refunded",
      },
      requestPayout: "Request payout",
      notEligible: "Need $50 to withdraw",
      notAffiliateTitle: "You're not an affiliate yet",
      notAffiliateBody: "Apply now to get your referral link and start earning 30% commission from customers you refer.",
      applyNow: "Apply now",
      applying: "Applying...",
      howTitle: "How it works",
      howSteps: [
        "Apply — admin approves within 24h",
        "Get your unique referral link",
        "Share your link — earn 30% commission every month",
      ],
      pendingNotice: "Your affiliate account is pending approval.",
      pendingNoticeDetail: "Admin will review and approve within 24h. You can still view your referral link.",
    },

    admin: {
      title: "Admin — Affiliate",
      settings: "Settings",
      affiliates: "Affiliates",
      commissions: "Commissions",
      saveSettings: "Save settings",
      settingsSaved: "Saved!",
      commissionRate: "Commission rate (%)",
      cookieDays: "Cookie (days)",
      minPayout: "Min payout ($)",
      programActive: "Program active",
      approve: "Approve",
      reject: "Reject",
      suspend: "Suspend",
      markPaid: "Mark paid",
      noCommissions: "No pending commissions.",
      paidSuccess: "Marked as paid.",
    },
  },
});
