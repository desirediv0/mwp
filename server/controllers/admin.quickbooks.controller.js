import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { encrypt, decrypt, maskSecret } from "../utils/encryption.js";
import {
  getQbSettings,
  isConnected,
  buildAuthUrl,
  verifyState,
  connectWithCode,
  disconnect,
  testCompany,
  syncOrder,
  refundOrder,
  syncPendingOrders,
  qbStats,
} from "../utils/quickbooks.js";

const apiBase = (req) => {
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0];
  return (process.env.API_PUBLIC_URL || `${proto}://${req.get("host")}`).replace(/\/$/, "");
};
const redirectUri = (req) => `${apiBase(req)}/api/admin/quickbooks/callback`;

const safeMask = (value) => {
  if (!value) return null;
  try {
    return maskSecret(decrypt(value));
  } catch {
    return null;
  }
};

const CLEARED_CONNECTION = {
  realmId: null,
  companyName: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  connectedAt: null,
  incomeAccountId: null,
  salesItemId: null,
  shippingItemId: null,
  taxItemId: null,
  discountAccountId: null,
};

const present = async (s, req) => ({
  isEnabled: s.isEnabled,
  environment: s.environment,
  syncMode: s.syncMode,
  connected: isConnected(s),
  companyName: s.companyName,
  realmId: s.realmId,
  connectedAt: s.connectedAt,
  lastSyncAt: s.lastSyncAt,
  lastError: s.lastError,
  redirectUri: redirectUri(req),
  sandbox: { clientId: s.sandboxClientId || "", secretMasked: safeMask(s.sandboxClientSecret) },
  production: { clientId: s.productionClientId || "", secretMasked: safeMask(s.productionClientSecret) },
  stats: await qbStats(),
});

export const getSettings = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponsive(200, await present(await getQbSettings(), req), "QuickBooks settings fetched"));
});

export const saveSettings = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const current = await getQbSettings();
  const data = {};
  const activeEnv = body.environment !== undefined ? body.environment : current.environment;

  if (body.environment !== undefined) {
    if (!["SANDBOX", "PRODUCTION"].includes(body.environment)) throw new ApiError(400, "Environment must be SANDBOX or PRODUCTION");
    data.environment = body.environment;
    // Tokens belong to one environment. Switching means connecting again.
    if (body.environment !== current.environment) Object.assign(data, CLEARED_CONNECTION, { isEnabled: false });
  }
  if (body.syncMode !== undefined) {
    if (!["AUTO", "MANUAL"].includes(body.syncMode)) throw new ApiError(400, "Sync mode must be AUTO or MANUAL");
    data.syncMode = body.syncMode;
  }

  for (const [field, value] of [
    ["sandboxClientId", body.sandbox?.clientId],
    ["productionClientId", body.production?.clientId],
  ]) {
    if (value === undefined) continue;
    const next = String(value).trim() || null;
    data[field] = next;
    const env = field === "sandboxClientId" ? "SANDBOX" : "PRODUCTION";
    // A different Client ID makes the old connection invalid
    if (next !== current[field] && env === activeEnv) Object.assign(data, CLEARED_CONNECTION, { isEnabled: false });
  }
  for (const [field, value] of [
    ["sandboxClientSecret", body.sandbox?.clientSecret],
    ["productionClientSecret", body.production?.clientSecret],
  ]) {
    if (value && String(value).trim()) data[field] = encrypt(String(value).trim());
  }

  if (body.isEnabled !== undefined) {
    if (body.isEnabled && !isConnected({ ...current, ...data })) {
      throw new ApiError(400, "Connect QuickBooks first, then turn syncing on.");
    }
    data.isEnabled = !!body.isEnabled;
  }

  const updated = Object.keys(data).length ? await prisma.quickBooksSettings.update({ where: { id: current.id }, data }) : current;
  res.status(200).json(new ApiResponsive(200, await present(updated, req), "QuickBooks settings saved"));
});

// Returns the Intuit sign-in URL; the admin's browser then opens it
export const getConnectUrl = asyncHandler(async (req, res) => {
  const returnUrl = String(req.query.returnUrl || "");
  if (returnUrl && !/^https?:\/\//i.test(returnUrl)) throw new ApiError(400, "Invalid return address");
  const url = await buildAuthUrl(redirectUri(req), req.admin.id, returnUrl);
  res.status(200).json(new ApiResponsive(200, { url }, "Open this address to connect QuickBooks"));
});

// Intuit redirects the admin's browser here after approval. No login header, so the signed state is the proof.
export const oauthCallback = asyncHandler(async (req, res) => {
  const { code, realmId, state, error } = req.query;
  const { ok, returnUrl } = verifyState(state);
  const back = (query) => {
    const base = /^https?:\/\//i.test(returnUrl || "") ? returnUrl : process.env.ADMIN_FRONTEND_URL || "";
    return base
      ? res.redirect(`${base.replace(/\/$/, "")}/quickbooks-settings?${query}`)
      : res.status(200).send(`QuickBooks: ${query}. You can close this tab.`);
  };
  if (!ok) return back("qb=invalid_state");
  if (error || !code || !realmId) return back("qb=denied");
  try {
    await connectWithCode({ code: String(code), realmId: String(realmId), redirectUri: redirectUri(req) });
    return back("qb=connected");
  } catch (err) {
    console.error("QuickBooks connect failed:", err.message);
    return back(`qb=failed&reason=${encodeURIComponent(err.message.slice(0, 120))}`);
  }
});

export const disconnectQb = asyncHandler(async (req, res) => {
  const s = await disconnect();
  await prisma.quickBooksSettings.update({ where: { id: s.id }, data: { isEnabled: false } });
  res.status(200).json(new ApiResponsive(200, await present(await getQbSettings(), req), "QuickBooks disconnected"));
});

export const testConnection = asyncHandler(async (req, res) => {
  const info = await testCompany();
  res.status(200).json(new ApiResponsive(200, info, "Connected to QuickBooks"));
});

export const syncOneOrder = asyncHandler(async (req, res) => {
  const result = await syncOrder(req.params.orderId);
  if (result.skipped === "not-paid") throw new ApiError(400, "Only paid orders can be sent to QuickBooks.");
  const quickbooks = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    select: { qbSalesReceiptId: true, qbSyncStatus: true, qbSyncError: true, qbSyncedAt: true, qbRefundIds: true },
  });
  res.status(200).json(new ApiResponsive(200, { result, quickbooks }, "Order sent to QuickBooks"));
});

export const refundOneOrder = asyncHandler(async (req, res) => {
  const result = await refundOrder(req.params.orderId, {});
  if (result.skipped === "never-synced") throw new ApiError(400, "This order was never sent to QuickBooks.");
  res.status(200).json(new ApiResponsive(200, result, "Refund recorded in QuickBooks"));
});

export const syncPending = asyncHandler(async (req, res) => {
  const result = await syncPendingOrders(50);
  res.status(200).json(new ApiResponsive(200, result, `${result.synced} order(s) sent to QuickBooks`));
});
