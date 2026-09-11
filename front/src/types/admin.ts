export interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SUPPORT_AGENT" | string;
  permissions: string[];
  lastLogin?: string;
  isActive?: boolean;
  language?: string; // e.g., "en", "hi", "es"
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  adminId: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | string;
  createdAt?: string;
  updatedAt?: string;
}

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SUPPORT_AGENT = "SUPPORT_AGENT",
}

export enum Resource {
  DASHBOARD = "dashboard",
  ADMINS = "admins",
  USERS = "users",
  PRODUCTS = "products",
  ORDERS = "orders",
  CATEGORIES = "categories",
  REVIEWS = "reviews",
  SETTINGS = "settings",
  INVENTORY = "inventory",
  FLAVORS = "flavors",
  WEIGHTS = "weights",
  COUPONS = "coupons",
  CONTENT = "content",
  CONTACT = "contact",
  FAQS = "faqs",
  ANALYTICS = "analytics",
  BRANDS = "brands",
  BANNERS = "banners",
  BUNDLES = "bundles",
  FRAGRANCE_QUIZ = "fragrance_quiz",
}

export enum Action {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

// Helper functions for permissions
export const formatPermission = (
  resource: Resource,
  action: Action
): string => {
  return `${resource}:${action}`;
};

export const parsePermission = (
  permission: string
): { resource: string; action: string } | null => {
  const parts = permission.split(":");
  if (parts.length !== 2) return null;

  return {
    resource: parts[0],
    action: parts[1],
  };
};

// Bundle Campaign Types
export interface BundlePricingSlab {
  id?: string;
  itemCount: number;
  price: number;
  label?: string;
}

export interface BundleRule {
  id?: string;
  minItems?: number;
  maxItems?: number;
  categories?: string[];
  brands?: string[];
}

export interface BundleCampaign {
  id: string;
  title: string;
  slug: string;
  description?: string;
  bundleType: "FIXED" | "MIX_AND_MATCH" | "BUY_X_GET_Y";
  discountType: "FLAT" | "PERCENTAGE" | "SLAB_BASED";
  bundlePrice?: number;
  discountValue?: number;
  banner?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  showOnWebsite: boolean;
  createdAt: string;
  updatedAt: string;
  rule?: BundleRule;
  pricingSlabs?: BundlePricingSlab[];
  orderBundleCount?: number;
}

export interface SecretAccess {
  id: string;
  userId?: string;
  orderId?: string;
  email: string;
  displayCode: string;
  status: "PENDING" | "ACTIVE" | "USED" | "REVOKED" | "EXPIRED";
  usageLimit: number;
  usageCount: number;
  expiresAt: string;
  activatedAt?: string;
  lastUsedAt?: string;
  lastUsedIP?: string;
  lastUsedDevice?: string;
  createdByAdmin?: string;
  revokedByAdmin?: string;
  revokedReason?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
  order?: { id: string; orderNumber: string; total: number };
}

export interface SecretAccessDashboardStats {
  total: number;
  pending: number;
  active: number;
  used: number;
  revoked: number;
  expired: number;
  totalActivations: number;
}
