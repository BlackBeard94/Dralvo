// Partner (reseller) program — shared types. Mirrors the partner_program migration.

export type PartnerStatus = "active" | "suspended";

export interface Partner {
  id: string;
  user_id: string;
  code: string;
  name: string | null;
  commission_rate: number; // 0..1
  status: PartnerStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined / computed (not a column)
  email?: string | null;
}

export type CommissionStatus = "pending" | "paid";

export interface PartnerCommission {
  id: string;
  partner_id: string;
  customer_user_id: string;
  source: "stripe" | "vietqr";
  sale_amount: number;
  currency: string;
  rate: number;             // snapshot of commission_rate at sale time
  commission_amount: number;
  period: string;           // 'YYYY-MM'
  status: CommissionStatus;
  external_ref: string | null;
  created_at: string;
  paid_at: string | null;
}

export type ReferrerType = "affiliate" | "partner";
