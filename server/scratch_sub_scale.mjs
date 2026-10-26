import { prisma } from "./config/db.js";
import {
  runSubscriptionJobs, sendDueReminders, renewSubscription, getSubscriptionSettings, addMonth,
  changeSubscriptionAddress, cancelAllForUser, getForecast,
} from "./utils/subscriptions.js";

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => { (cond ? pass++ : fail++); console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); };

const variant = await prisma.productVariant.findFirst({ where: { product: { slug: "her-power" } }, include: { product: true } });
const startQty = variant.quantity;
const settings = await getSubscriptionSettings();
const orig = { isEnabled: settings.isEnabled, discountPercent: settings.discountPercent, reminderDays: settings.reminderDays, maxRetries: settings.maxRetries };
await prisma.subscriptionSettings.update({ where: { id: settings.id }, data: { isEnabled: true, discountPercent: 10, reminderDays: 3, maxRetries: 3 } });
await prisma.productVariant.update({ where: { id: variant.id }, data: { quantity: 5000 } });

const tag = `scale-${Date.now()}`;
const N = 120;
const users = [];
for (let i = 0; i < N; i++) {
  const u = await prisma.user.create({ data: { email: `${tag}-${i}@example.com`, name: `Scale ${i}`, phone: "+15625243557", otpVerified: true } });
  const a = await prisma.address.create({ data: { userId: u.id, name: `Scale ${i}`, street: "100 Main St", city: "Long Beach", state: "CA", postalCode: "90802", country: "US", phone: "+15625243557", isDefault: true } });
  users.push({ u, a });
}

let inflight = 0, maxInflight = 0, charges = 0;
const keys = new Set();
const fakeStripe = {
  paymentIntents: {
    create: async (params, opts) => {
      inflight++; maxInflight = Math.max(maxInflight, inflight);
      await new Promise((r) => setTimeout(r, 15));
      inflight--;
      keys.add(opts.idempotencyKey);
      charges++;
      return { id: `pi_${charges}`, status: "succeeded" };
    },
  },
  refunds: { create: async () => ({}) },
};
const factory = async () => ({ stripe: fakeStripe, settings: { mode: "TEST", userId: users[0].u.id } });

try {
  const pastDue = new Date(Date.now() - 3600 * 1000);
  const inTwoDays = new Date(Date.now() + 2 * 86400000);
  // 120 subscriptions: 100 due now, 20 due in 2 days (reminder window)
  for (let i = 0; i < N; i++) {
    await prisma.subscription.create({
      data: {
        userId: users[i].u.id, productId: variant.product.id, variantId: variant.id, quantity: 1, discountPercent: 10,
        shippingAddressId: users[i].a.id, stripeCustomerId: "cus_x", stripePaymentMethodId: "pm_x", stripeMode: "TEST",
        nextBillingDate: i < 100 ? pastDue : inTwoDays, lastBilledAt: new Date(Date.now() - 28 * 86400000),
        productSnapshot: { name: variant.product.name },
      },
    });
  }
  const t0 = Date.now();
  const r = await runSubscriptionJobs({ stripeFactory: factory });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("run result:", JSON.stringify(r), `in ${secs}s`);
  check("all 100 due subscriptions charged in one run", r.charged === 100 && charges === 100);
  check("never more than 5 charges in flight", maxInflight <= 5 && maxInflight > 1, `max ${maxInflight}`);
  check("100 unique idempotency keys (no double charge)", keys.size === 100);
  check("100 renewal orders exist", (await prisma.order.count({ where: { userId: { in: users.map((x) => x.u.id) }, isSubscriptionRenewal: true } })) === 100);
  const v = await prisma.productVariant.findUnique({ where: { id: variant.id } });
  check("stock reduced by 100", v.quantity === 4900, `${v.quantity}`);
  const second = await runSubscriptionJobs({ stripeFactory: factory });
  check("second run charges nothing", second.charged === 0 && charges === 100);
  // reminders: the 20 due in 2 days are marked even though mail is unavailable here -> they must be released for retry
  const remindedNow = await prisma.subscription.count({ where: { userId: { in: users.map((x) => x.u.id) }, reminderSentFor: { not: null }, status: "ACTIVE" } });
  console.log("reminders marked after run (mail down => released):", remindedNow);
  check("reminder claims released when the mail server fails", remindedNow === 0);

  // forecast
  const f = await getForecast(30);
  check("forecast counts upcoming units", f.totalSubscriptions >= 20 && f.products.some((p) => p.variantId === variant.id));

  // out of stock -> postponed, not counted as a failed payment
  const sA = await prisma.subscription.findFirst({ where: { userId: users[0].u.id } });
  await prisma.productVariant.update({ where: { id: variant.id }, data: { quantity: 0 } });
  await prisma.subscription.update({ where: { id: sA.id }, data: { nextBillingDate: new Date(Date.now() - 1000) } });
  const oos = await renewSubscription(sA.id, { stripeFactory: factory });
  const afterOos = await prisma.subscription.findUnique({ where: { id: sA.id } });
  check("out of stock is postponed 3 days, not a failure", oos.postponed === true && afterOos.failedAttempts === 0 && afterOos.status === "ACTIVE" && afterOos.nextBillingDate > new Date(Date.now() + 2 * 86400000));
  await prisma.productVariant.update({ where: { id: variant.id }, data: { quantity: 4900 } });

  // product removed -> cancelled
  const sB = await prisma.subscription.findFirst({ where: { userId: users[1].u.id } });
  await prisma.product.update({ where: { id: variant.product.id }, data: { isActive: false } });
  await prisma.subscription.update({ where: { id: sB.id }, data: { nextBillingDate: new Date(Date.now() - 1000) } });
  const gone = await renewSubscription(sB.id, { stripeFactory: factory });
  await prisma.product.update({ where: { id: variant.product.id }, data: { isActive: true } });
  const afterGone = await prisma.subscription.findUnique({ where: { id: sB.id } });
  check("product no longer sold -> subscription cancelled by system", gone.cancelled === true && afterGone.status === "CANCELLED" && afterGone.cancelledBy === "SYSTEM");

  // address deleted -> falls back to the default address
  const sC = await prisma.subscription.findFirst({ where: { userId: users[2].u.id } });
  const newAddr = await prisma.address.create({ data: { userId: users[2].u.id, name: "Second", street: "200 Ocean Blvd", city: "Long Beach", state: "CA", postalCode: "90802", country: "US", phone: "+15625243557", isDefault: false } });
  await prisma.address.delete({ where: { id: sC.shippingAddressId } }).catch(() => {});
  await prisma.subscription.update({ where: { id: sC.id }, data: { nextBillingDate: new Date(Date.now() - 1000) } });
  const fb = await renewSubscription(sC.id, { stripeFactory: factory });
  const afterFb = await prisma.subscription.findUnique({ where: { id: sC.id } });
  check("deleted address -> uses the remaining address", fb.ok === true && afterFb.shippingAddressId === newAddr.id);

  // user changes the delivery address
  const sD = await prisma.subscription.findFirst({ where: { userId: users[3].u.id } });
  const addr2 = await prisma.address.create({ data: { userId: users[3].u.id, name: "Other", street: "300 Pine Ave", city: "Long Beach", state: "CA", postalCode: "90802", country: "US", phone: "+15625243557" } });
  const ch = await changeSubscriptionAddress(sD.id, users[3].u.id, addr2.id);
  check("customer can change the subscription address", ch.shippingAddressId === addr2.id);
  const bad = await changeSubscriptionAddress(sD.id, users[3].u.id, users[4].a.id).then(() => "no-error", (e) => e.message);
  check("cannot use someone else's address", /not found/i.test(bad));

  // account closing cancels everything
  const closed = await cancelAllForUser(users[5].u.id, "Account deleted");
  const sE = await prisma.subscription.findFirst({ where: { userId: users[5].u.id } });
  check("account closing cancels subscriptions", closed.count === 1 && sE.status === "CANCELLED");
} finally {
  const ids = users.map((x) => x.u.id);
  await prisma.product.update({ where: { id: variant.product.id }, data: { isActive: true } });
  await prisma.order.deleteMany({ where: { userId: { in: ids } } });
  await prisma.subscription.deleteMany({ where: { userId: { in: ids } } });
  await prisma.inventoryLog.deleteMany({ where: { createdBy: { in: ids } } });
  await prisma.stripePayment.deleteMany({ where: { userId: { in: ids } } });
  await prisma.address.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.productVariant.update({ where: { id: variant.id }, data: { quantity: startQty } });
  await prisma.subscriptionSettings.update({ where: { id: settings.id }, data: orig });
  console.log(`\n${pass} passed, ${fail} failed (cleaned up, stock restored to ${startQty})`);
  await prisma.$disconnect();
}
