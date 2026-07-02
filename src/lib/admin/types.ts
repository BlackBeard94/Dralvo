// ponytail: one roles type, one permissions type, no role hierarchy table joins
export type AdminRole = "super_admin" | "admin" | "support";

/** bitmask-style permission flags — stored as JSONB in admin_users.permissions */
export interface AdminPermissions {
  users: { view: boolean; edit: boolean };
  license: { manage: boolean };
  finance: { view: boolean };
  marketing: { view: boolean };
  affiliate: { manage: boolean };
  admins: { manage: boolean };
}

export type AdminPermissionAction =
  | "users.view"
  | "users.edit"
  | "license.manage"
  | "finance.view"
  | "marketing.view"
  | "affiliate.manage"
  | "admins.manage";

export interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  permissions: AdminPermissions;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  email?: string | null;
}

/** Permissions a super_admin cannot remove from themselves */
export const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  users: { view: true, edit: true },
  license: { manage: true },
  finance: { view: true },
  marketing: { view: true },
  affiliate: { manage: true },
  admins: { manage: true },
};

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  users: { view: true, edit: false },
  license: { manage: false },
  finance: { view: true },
  marketing: { view: false },
  affiliate: { manage: false },
  admins: { manage: false },
};

export const DEFAULT_SUPPORT_PERMISSIONS: AdminPermissions = {
  users: { view: true, edit: false },
  license: { manage: false },
  finance: { view: false },
  marketing: { view: false },
  affiliate: { manage: false },
  admins: { manage: false },
};
