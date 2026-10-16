import crypto from "crypto";
import { prisma } from "../config/db.js";
import { encrypt, decrypt } from "./encryption.js";
import { ApiError } from "./ApiError.js";
import { notifyAdmin } from "./notify.js";

// QuickBooks Online (accounting) client.
// - OAuth2 connect (the admin signs in to Intuit once), tokens stored encrypted and refreshed automatically.
// - Every paid order becomes a Sales Receipt (customer, items, discount, shipping, tax).
// - Cancelled / refunded orders and completed returns become Refund Receipts.
// Test keys use Intuit's sandbox company, live keys use the real company.

const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = process.env.QBO_TOKEN_URL || "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const MINOR_VERSION = 75;
const SCOPE = "com.intuit.quickbooks.accounting";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "RETURN_APPROVED"];

/* -------------------- settings -------------------- */

export async function getQbSettings() {
  let s = await prisma.quickBooksSettings.findFirst();
  if (!s) s = await prisma.quickBooksSettings.create({ data: {} });
  return s;
}

const dec = (v) => {
  if (!v) return null;
  try {
    return decrypt(v);
  } catch {
    return null;
  }
};

export function credentialsFor(settings) {
  const sandbox = settings.environment !== "PRODUCTION";
  return {
    clientId: sandbox ? settings.sandboxClientId : settings.productionClientId,
    clientSecret: dec(sandbox ? settings.sandboxClientSecret : settings.productionClientSecret),
  };
}

const apiBase = (settings) =>
  process.env.QBO_API_URL ||
  (settings.environment === "PRODUCTION" ? "https://quickbooks.api.intuit.com" : "https://sandbox-quickbooks.api.intuit.com");

export const isConnected = (s) => !!(s.realmId && s.refreshToken);

/* -------------------- OAuth -------------------- */

const stateKey = () => process.env.ADMIN_JWT_SECRET || process.env.ENCRYPTION_KEY || "mwp-qbo";

export function signState(adminId, returnUrl = "") {
  const body = `${adminId}.${Date.now()}.${crypto.randomBytes(6).toString("hex")}.${Buffer.from(returnUrl).toString("base64url")}`;
  const sig = crypto.createHmac("sha256", stateKey()).update(body).digest("hex");
  return Buffer.from(`${body}.${sig}`).toString("base64url");
}

export function verifyState(state) {
  try {
    const raw = Buffer.from(String(state), "base64url").toString();
    const idx = raw.lastIndexOf(".");
    const body = raw.slice(0, idx);
    const sig = raw.slice(idx + 1);
    const expected = crypto.createHmac("sha256", stateKey()).update(body).digest("hex");
    const ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    const issuedAt = Number(body.split(".")[1]);
    const returnUrl = Buffer.from(body.split(".")[3] || "", "base64url").toString();
    return { ok: ok && Date.now() - issuedAt < 15 * 60 * 1000, returnUrl };
  } catch {
    return { ok: false, returnUrl: "" };
  }
}

export async function buildAuthUrl(redirectUri, adminId, returnUrl = "") {
  const settings = await getQbSettings();
  const { clientId, clientSecret } = credentialsFor(settings);
  if (!clientId || !clientSecret) {
    throw new ApiError(400, `Save the ${settings.environment === "PRODUCTION" ? "live" : "test (sandbox)"} Client ID and Client Secret first.`);
  }
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: SCOPE,
    redirect_uri: redirectUri,
    state: signState(adminId, returnUrl),
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function tokenRequest(settings, form) {
  const { clientId, clientSecret } = credentialsFor(settings);
  if (!clientId || !clientSecret) throw new ApiError(400, "QuickBooks keys are missing. Save them in Admin > QuickBooks.");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(form).toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new ApiError(400, `QuickBooks sign-in failed: ${json.error_description || json.error || `HTTP ${res.status}`}`);
    err.qbAuthError = json.error;
    throw err;
  }
  return json;
}

async function saveTokens(settings, tokens, extra = {}) {
  return prisma.quickBooksSettings.update({
    where: { id: settings.id },
    data: {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      accessTokenExpiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + (tokens.x_refresh_token_expires_in || 8640000) * 1000),
      lastError: null,
      ...extra,
    },
  });
}

// Called from the OAuth redirect: swaps the code for tokens and remembers the company
export async function connectWithCode({ code, realmId, redirectUri }) {
  let settings = await getQbSettings();
  const tokens = await tokenRequest(settings, { grant_type: "authorization_code", code, redirect_uri: redirectUri });
  settings = await saveTokens(settings, tokens, { realmId: String(realmId), connectedAt: new Date() });
  let companyName = null;
  try {
    const info = await qbRequest("GET", `/companyinfo/${realmId}`);
    companyName = info?.CompanyInfo?.CompanyName || null;
  } catch {
    /* name is optional */
  }
  return prisma.quickBooksSettings.update({ where: { id: settings.id }, data: { companyName } });
}

export async function disconnect() {
  const s = await getQbSettings();
  return prisma.quickBooksSettings.update({
    where: { id: s.id },
    data: {
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
    },
  });
}

let refreshing = null;
async function ensureAccessToken(force = false) {
  const settings = await getQbSettings();
  if (!isConnected(settings)) throw new ApiError(400, "QuickBooks is not connected. Connect it in Admin > QuickBooks.");
  const fresh = settings.accessToken && settings.accessTokenExpiresAt && settings.accessTokenExpiresAt.getTime() - Date.now() > 120000;
  if (fresh && !force) return { settings, accessToken: dec(settings.accessToken) };

  if (!refreshing) {
    refreshing = (async () => {
      try {
        const tokens = await tokenRequest(settings, { grant_type: "refresh_token", refresh_token: dec(settings.refreshToken) || "" });
        return await saveTokens(settings, tokens);
      } catch (err) {
        if (err.qbAuthError === "invalid_grant") {
          await prisma.quickBooksSettings.update({
            where: { id: settings.id },
            data: { accessToken: null, refreshToken: null, lastError: "The QuickBooks connection expired. Please connect again." },
          });
          throw new ApiError(400, "The QuickBooks connection expired. Please connect again in Admin > QuickBooks.");
        }
        throw err;
      } finally {
        refreshing = null;
      }
    })();
  }
  const updated = await refreshing;
  return { settings: updated, accessToken: dec(updated.accessToken) };
}

/* -------------------- API calls -------------------- */

function faultMessage(json, status) {
  const fault = json?.Fault || json?.fault;
  const e = fault?.Error?.[0];
  if (e) return `${e.Message}${e.Detail ? `: ${e.Detail}` : ""}${e.code ? ` (code ${e.code})` : ""}`;
  return json?.error || `HTTP ${status}`;
}

export async function qbRequest(method, path, body, { retried = false, query = "" } = {}) {
  const { settings, accessToken } = await ensureAccessToken(retried);
  const joiner = path.includes("?") ? "&" : "?";
  const url = `${apiBase(settings)}/v3/company/${settings.realmId}${path}${joiner}minorversion=${MINOR_VERSION}${query}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !retried) return qbRequest(method, path, body, { retried: true, query });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new ApiError(res.status >= 500 ? 502 : 400, `QuickBooks: ${faultMessage(json, res.status)}`);
    err.qbFault = json?.Fault?.Error?.[0];
    throw err;
  }
  return json;
}

const esc = (v) => String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

async function qbQuery(sql) {
  const json = await qbRequest("GET", `/query?query=${encodeURIComponent(sql)}`);
  return json?.QueryResponse || {};
}

/* -------------------- one-time setup in the QuickBooks company -------------------- */

async function ensureAccount(settings, field, { name, accountType, subType }) {
  if (settings[field]) return settings[field];
  const found = (await qbQuery(`select * from Account where Name = '${esc(name)}'`)).Account?.[0];
  let id = found?.Id;
  if (!id) {
    const created = await qbRequest("POST", "/account", { Name: name, AccountType: accountType, ...(subType ? { AccountSubType: subType } : {}) });
    id = created.Account.Id;
  }
  await prisma.quickBooksSettings.update({ where: { id: settings.id }, data: { [field]: id } });
  settings[field] = id;
  return id;
}

async function ensureIncomeAccount(settings) {
  if (settings.incomeAccountId) return settings.incomeAccountId;
  const preferred = (await qbQuery(`select * from Account where AccountType = 'Income' and Active = true`)).Account || [];
  const pick = preferred.find((a) => /sales/i.test(a.Name)) || preferred[0];
  if (pick) {
    await prisma.quickBooksSettings.update({ where: { id: settings.id }, data: { incomeAccountId: pick.Id } });
    settings.incomeAccountId = pick.Id;
    return pick.Id;
  }
  return ensureAccount(settings, "incomeAccountId", { name: "MWP Online Sales", accountType: "Income", subType: "SalesOfProductIncome" });
}

async function ensureItem(settings, field, name) {
  if (settings[field]) return settings[field];
  const found = (await qbQuery(`select * from Item where Name = '${esc(name)}'`)).Item?.[0];
  let id = found?.Id;
  if (!id) {
    const incomeId = await ensureIncomeAccount(settings);
    const created = await qbRequest("POST", "/item", { Name: name, Type: "Service", IncomeAccountRef: { value: incomeId } });
    id = created.Item.Id;
  }
  await prisma.quickBooksSettings.update({ where: { id: settings.id }, data: { [field]: id } });
  settings[field] = id;
  return id;
}

async function refundFromAccountId(settings) {
  if (settings.depositAccountId) return settings.depositAccountId;
  const bank = (await qbQuery(`select * from Account where AccountType = 'Bank' and Active = true`)).Account?.[0];
  if (bank) return bank.Id;
  const undeposited = (await qbQuery(`select * from Account where AccountSubType = 'UndepositedFunds'`)).Account?.[0];
  if (undeposited) return undeposited.Id;
  throw new ApiError(400, "No bank account found in QuickBooks to take the refund from. Add one in QuickBooks.");
}

/* -------------------- customers -------------------- */

const addr = (a) =>
  a
    ? {
        Line1: a.street || a.line1 || a.address || undefined,
        City: a.city || undefined,
        CountrySubDivisionCode: a.state || undefined,
        PostalCode: a.postalCode || a.zip || undefined,
        Country: "USA",
      }
    : undefined;

async function findOrCreateCustomer(order) {
  const user = order.user || {};
  const snap = order.shippingAddressSnapshot || {};
  const email = user.email || snap.email || null;
  const name = (snap.name || user.name || email || "Online customer").toString().trim();

  if (email) {
    const existing = (await qbQuery(`select * from Customer where PrimaryEmailAddr = '${esc(email)}'`)).Customer?.[0];
    if (existing) return existing.Id;
  }
  const displayName = email ? `${name} (${email})` : `${name} (${order.orderNumber})`;
  const payload = {
    DisplayName: displayName.slice(0, 100),
    GivenName: name.split(" ")[0]?.slice(0, 25),
    FamilyName: name.split(" ").slice(1).join(" ").slice(0, 25) || undefined,
    ...(email ? { PrimaryEmailAddr: { Address: email } } : {}),
    ...(user.phone || snap.phone ? { PrimaryPhone: { FreeFormNumber: String(user.phone || snap.phone) } } : {}),
    BillAddr: addr(snap),
    ShipAddr: addr(snap),
  };
  try {
    const created = await qbRequest("POST", "/customer", payload);
    return created.Customer.Id;
  } catch (err) {
    if (String(err.qbFault?.code) === "6240") {
      const dup = (await qbQuery(`select * from Customer where DisplayName = '${esc(payload.DisplayName)}'`)).Customer?.[0];
      if (dup) return dup.Id;
    }
    throw err;
  }
}

/* -------------------- sales receipts -------------------- */

const money = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

async function buildLines(settings, order, { taxCode = true } = {}) {
  const salesItem = await ensureItem(settings, "salesItemId", "MWP Online Sales");
  const tax = taxCode ? { TaxCodeRef: { value: "NON" } } : {};
  const lines = [];

  for (const item of order.items || []) {
    const snap = item.productSnapshot || {};
    const label = [snap.name || item.product?.name || "Product", snap.sku ? `SKU ${snap.sku}` : null].filter(Boolean).join(" - ");
    const qty = item.quantity || 1;
    const amount = money(item.subtotal);
    lines.push({
      Amount: amount,
      DetailType: "SalesItemLineDetail",
      Description: label.slice(0, 4000),
      SalesItemLineDetail: { ItemRef: { value: salesItem }, Qty: qty, UnitPrice: money(amount / qty), ...tax },
    });
  }
  for (const b of order.orderBundles || []) {
    const amount = money(b.bundlePrice);
    if (!amount) continue;
    lines.push({
      Amount: amount,
      DetailType: "SalesItemLineDetail",
      Description: `Bundle: ${b.bundleName || "Bundle"}`.slice(0, 4000),
      SalesItemLineDetail: { ItemRef: { value: salesItem }, Qty: 1, UnitPrice: amount, ...tax },
    });
  }
  const discount = money(order.discount);
  if (discount > 0) {
    lines.push({
      Amount: -discount,
      DetailType: "SalesItemLineDetail",
      Description: order.couponCode ? `Discount (coupon ${order.couponCode})` : "Discount",
      SalesItemLineDetail: { ItemRef: { value: salesItem }, Qty: 1, UnitPrice: -discount, ...tax },
    });
  }
  const shipping = money(order.shippingCost);
  if (shipping > 0) {
    const shipItem = await ensureItem(settings, "shippingItemId", "MWP Shipping Charged");
    lines.push({
      Amount: shipping,
      DetailType: "SalesItemLineDetail",
      Description: `Shipping${order.shippingCarrier ? ` (${order.shippingCarrier} ${order.shippingService || ""})`.trimEnd() : ""}`,
      SalesItemLineDetail: { ItemRef: { value: shipItem }, Qty: 1, UnitPrice: shipping, ...tax },
    });
  }
  const salesTax = money(order.tax);
  if (salesTax > 0) {
    const taxItem = await ensureItem(settings, "taxItemId", "MWP Sales Tax Collected");
    lines.push({
      Amount: salesTax,
      DetailType: "SalesItemLineDetail",
      Description: "Sales tax collected",
      SalesItemLineDetail: { ItemRef: { value: taxItem }, Qty: 1, UnitPrice: salesTax, ...tax },
    });
  }

  // The receipt must equal what the customer paid in Stripe, to the cent
  const sum = money(lines.reduce((t, l) => t + l.Amount, 0));
  const diff = money(order.total - sum);
  if (Math.abs(diff) >= 0.01) {
    lines.push({
      Amount: diff,
      DetailType: "SalesItemLineDetail",
      Description: "Rounding adjustment",
      SalesItemLineDetail: { ItemRef: { value: salesItem }, Qty: 1, UnitPrice: diff, ...tax },
    });
  }
  return lines;
}

const dateOnly = (d) => new Date(d || Date.now()).toISOString().slice(0, 10);
const looksLikeTaxCodeError = (err) => /tax\s*code|TaxCode/i.test(`${err.qbFault?.Message || ""} ${err.qbFault?.Detail || ""} ${err.message}`);

const orderInclude = {
  user: true,
  items: { include: { product: { select: { name: true } } } },
  orderBundles: true,
  stripePayment: true,
};

const locks = new Set();

export async function syncOrder(orderId, { force = false } = {}) {
  if (locks.has(orderId)) return { skipped: "busy" };
  locks.add(orderId);
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.qbSalesReceiptId && !force) return { skipped: "already-synced", receiptId: order.qbSalesReceiptId };
    if (!PAID_STATUSES.includes(order.status) && !(order.status === "REFUNDED" && order.stripePayment)) {
      return { skipped: "not-paid" };
    }
    const settings = await getQbSettings();
    if (!isConnected(settings)) throw new ApiError(400, "QuickBooks is not connected.");

    // Safety net against duplicates (for example the app crashed after QuickBooks saved the receipt)
    const dup = (await qbQuery(`select Id from SalesReceipt where DocNumber = '${esc(order.orderNumber.slice(0, 21))}'`)).SalesReceipt?.[0];
    if (dup && !order.qbSalesReceiptId) {
      await prisma.order.update({ where: { id: orderId }, data: { qbSalesReceiptId: dup.Id, qbSyncStatus: "SYNCED", qbSyncError: null, qbSyncedAt: new Date() } });
      return { receiptId: dup.Id, existing: true };
    }

    const customerId = await findOrCreateCustomer(order);
    const snap = order.shippingAddressSnapshot || {};
    const build = async (taxCode) => ({
      DocNumber: order.orderNumber.slice(0, 21),
      TxnDate: dateOnly(order.createdAt),
      CustomerRef: { value: customerId },
      Line: await buildLines(settings, order, { taxCode }),
      TotalAmt: money(order.total),
      PrivateNote: `Website order ${order.orderNumber}${order.stripePayment?.paymentIntentId ? ` / Stripe ${order.stripePayment.paymentIntentId}` : ""}`.slice(0, 4000),
      CustomerMemo: { value: `Thank you for your order ${order.orderNumber}` },
      ...(order.user?.email ? { BillEmail: { Address: order.user.email } } : {}),
      ShipAddr: addr(snap),
      ...(settings.depositAccountId ? { DepositToAccountRef: { value: settings.depositAccountId } } : {}),
    });

    const post = (payload) => qbRequest("POST", "/salesreceipt", payload, { query: `&requestid=mwp-order-${order.id}`.slice(0, 120) });
    let created;
    try {
      created = await post(await build(true));
    } catch (err) {
      if (!looksLikeTaxCodeError(err)) throw err;
      created = await post(await build(false));
    }
    const id = created.SalesReceipt.Id;
    await prisma.order.update({
      where: { id: orderId },
      data: { qbSalesReceiptId: id, qbSyncStatus: "SYNCED", qbSyncError: null, qbSyncedAt: new Date() },
    });
    await prisma.quickBooksSettings.update({ where: { id: settings.id }, data: { lastSyncAt: new Date(), lastError: null } });
    return { receiptId: id };
  } catch (err) {
    await prisma.order
      .update({ where: { id: orderId }, data: { qbSyncStatus: "FAILED", qbSyncError: String(err.message).slice(0, 400) } })
      .catch(() => {});
    await prisma.quickBooksSettings.updateMany({ data: { lastError: String(err.message).slice(0, 400) } }).catch(() => {});
    throw err;
  } finally {
    locks.delete(orderId);
  }
}

// Refund Receipt for a cancelled/refunded order (whole order) or for a returned item (amount given)
export async function refundOrder(orderId, { amount = null, description = null } = {}) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) throw new ApiError(404, "Order not found");
  if (!order.qbSalesReceiptId) return { skipped: "never-synced" };
  if (order.qbSyncStatus === "REFUNDED") return { skipped: "already-refunded" };

  const settings = await getQbSettings();
  const customerId = await findOrCreateCustomer(order);
  const full = amount === null || money(amount) >= money(order.total);
  const refundNumber = `${order.orderNumber}-R${(order.qbRefundIds?.length || 0) + 1}`.slice(0, 21);

  const make = async (taxCode) => {
    let Line;
    if (full) {
      Line = await buildLines(settings, order, { taxCode });
    } else {
      const salesItem = await ensureItem(settings, "salesItemId", "MWP Online Sales");
      const amt = money(amount);
      Line = [
        {
          Amount: amt,
          DetailType: "SalesItemLineDetail",
          Description: (description || "Returned item refund").slice(0, 4000),
          SalesItemLineDetail: { ItemRef: { value: salesItem }, Qty: 1, UnitPrice: amt, ...(taxCode ? { TaxCodeRef: { value: "NON" } } : {}) },
        },
      ];
    }
    return {
      DocNumber: refundNumber,
      TxnDate: dateOnly(),
      CustomerRef: { value: customerId },
      Line,
      PrivateNote: `Refund for website order ${order.orderNumber}`,
      DepositToAccountRef: { value: await refundFromAccountId(settings) },
    };
  };

  const post = (payload) => qbRequest("POST", "/refundreceipt", payload, { query: `&requestid=mwp-refund-${order.id}-${refundNumber}`.slice(0, 120) });
  let created;
  try {
    created = await post(await make(true));
  } catch (err) {
    if (!looksLikeTaxCodeError(err)) throw err;
    created = await post(await make(false));
  }
  const refunded = (await prisma.order.findUnique({ where: { id: orderId }, select: { qbRefundIds: true } })).qbRefundIds || [];
  await prisma.order.update({
    where: { id: orderId },
    data: { qbRefundIds: [...refunded, created.RefundReceipt.Id], qbSyncStatus: full ? "REFUNDED" : "PARTIAL_REFUND", qbSyncError: null },
  });
  return { refundId: created.RefundReceipt.Id, full };
}

/* -------------------- safe wrappers used by the order flows -------------------- */

async function autoEnabled() {
  const s = await getQbSettings();
  return s.isEnabled && isConnected(s) && s.syncMode === "AUTO";
}

async function alertFailure(subject, order, err) {
  await notifyAdmin(subject, {
    title: "QuickBooks sync problem",
    danger: true,
    paragraphs: ["An order could not be sent to QuickBooks. Open the order in the admin panel and click Sync to QuickBooks to retry."],
    rows: [["Order", order || ""], ["Reason", err.message]],
  });
}

export async function autoSyncOrder(orderId) {
  try {
    if (!(await autoEnabled())) return null;
    return await syncOrder(orderId);
  } catch (err) {
    console.error(`QuickBooks sync failed for order ${orderId}:`, err.message);
    const o = await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } }).catch(() => null);
    await alertFailure(`QuickBooks sync failed - order #${o?.orderNumber || orderId}`, o?.orderNumber ? `#${o.orderNumber}` : orderId, err);
    return null;
  }
}

export async function autoRefundOrder(orderId, opts) {
  try {
    if (!(await autoEnabled())) return null;
    return await refundOrder(orderId, opts);
  } catch (err) {
    console.error(`QuickBooks refund failed for order ${orderId}:`, err.message);
    const o = await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } }).catch(() => null);
    await alertFailure(`QuickBooks refund entry failed - order #${o?.orderNumber || orderId}`, o?.orderNumber ? `#${o.orderNumber}` : orderId, err);
    return null;
  }
}

// "Sync all": paid orders that never reached QuickBooks (or failed)
export async function syncPendingOrders(limit = 50) {
  const orders = await prisma.order.findMany({
    where: { qbSalesReceiptId: null, status: { in: PAID_STATUSES }, OR: [{ qbSyncStatus: null }, { qbSyncStatus: "FAILED" }] },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, orderNumber: true },
  });
  const results = { total: orders.length, synced: 0, failed: 0, errors: [] };
  for (const o of orders) {
    try {
      const r = await syncOrder(o.id);
      if (r.receiptId) results.synced += 1;
    } catch (err) {
      results.failed += 1;
      if (results.errors.length < 5) results.errors.push(`#${o.orderNumber}: ${err.message}`);
    }
  }
  return results;
}

export async function qbStats() {
  const [synced, failed, pending] = await Promise.all([
    prisma.order.count({ where: { qbSyncStatus: { in: ["SYNCED", "PARTIAL_REFUND", "REFUNDED"] } } }),
    prisma.order.count({ where: { qbSyncStatus: "FAILED" } }),
    prisma.order.count({ where: { qbSalesReceiptId: null, status: { in: PAID_STATUSES }, OR: [{ qbSyncStatus: null }, { qbSyncStatus: "FAILED" }] } }),
  ]);
  return { synced, failed, pending };
}

export async function testCompany() {
  const s = await getQbSettings();
  const info = await qbRequest("GET", `/companyinfo/${s.realmId}`);
  return { companyName: info?.CompanyInfo?.CompanyName || null, country: info?.CompanyInfo?.Country || null };
}
