/**
 * Affiliate system types.
 * All monetary values in USD cents (integers) or USD floats depending on context.
 */

export interface AffiliateSettings {
  commission_rate: number; // 0.0–1.0, e.g. 0.30 = 30%
  cookie_days: number;     // referral cookie lifetime in days
  min_payout: number;      // minimum USD to request payout
  program_active: boolean;
}

export interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  status: "pending" | "active" | "suspended" | "rejected";
  display_name: string | null;
  total_earned: number;
  paid_out: number;
  created_at: string;
  approved_at: string | null;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  visitor_id: string;
  clicked_at: string;
  converted: boolean;
  converted_at: string | null;
  customer_id: string | null;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referral_id: string | null;
  customer_id: string | null;
  subscription_id: string | null;
  amount: number;
  source_amount: number | null;
  period_start: string | null;
  period_end: string | null;
  status: "pending" | "paid" | "cancelled" | "refunded";
  paid_at: string | null;
  created_at: string;
}

/** Stats for affiliate dashboard */
export interface AffiliateStats {
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  pending_earnings: number;
  total_earned: number;
  paid_out: number;
  available_for_payout: number;
}

/** Admin: affiliate with user info */
export interface AffiliateWithUser extends Affiliate {
  user_email: string | null;
}
