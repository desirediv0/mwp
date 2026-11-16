import fs from "fs";
import path from "path";
import { prisma } from "../config/db.js";

// Replaces the website FAQ list with the client's "MWP Supplements - Frequently Asked Questions" (MWP_FAQs.pdf).
// The old FAQs are saved to server/backups/ first. Edit them later in Admin > FAQs.
// Run:  node -r dotenv/config scripts/importClientFaqs.js
//
// The PDF prints (562) 524-3557 as the phone; the site's contact number is the toll-free line, so that is used here.

const PHONE = "(800) 814-4477";

const FAQS = [
  ["About MWP", [
    ["What makes MWP different?", "We show every ingredient and the exact amount of each one on the label. There are no hidden blends. Every formula is third-party lab tested, and the QR code on your bottle takes you to our testing documents."],
    ["What does MWP stand for?", "Men | Women | Power. We make daily formulas for men and women."],
    ["Where are MWP products made?", "Manufactured in the USA with domestic and imported ingredients, in an FDA-registered, cGMP-compliant facility."],
    ["Are MWP products FDA approved?", "No. The FDA does not approve dietary supplements. Our products are made in an FDA-registered facility, but FDA registration is not FDA approval."],
    ["What does \"third-party lab tested\" mean?", "An independent lab, not MWP, tests our products. You can see the reports on our Certificate Wall or by scanning the \"Scan for Trust\" QR code on your bottle."],
  ]],
  ["Our Products", [
    ["Which MWP product is right for me?", "Take our 1-minute Find Your Formula quiz. In short: Daily Vitality is a daily wellness formula for men and women. Her Power is a daily wellness formula for women. Power Max is a men's training formula. Rapid Boost is a pre-workout formula. If you have a health condition or take medication, talk to your doctor before choosing a supplement."],
    ["Where can I see the full ingredient list?", "Every product page shows the full Supplement Facts panel with each ingredient and amount. You can also scan the \"Ingredients & Usage\" QR code on your bottle."],
    ["Why do some formulas need 3 capsules a day?", "We use full ingredient amounts, which need more room than one or two capsules. Splitting the serving into 3 capsules keeps each capsule easy to swallow."],
    ["How long does one bottle last?", "One bottle is a 30-day supply. Power Max, Rapid Boost and Her Power have 90 capsules (3 a day). Daily Vitality has 60 capsules (2 a day)."],
    ["Does Rapid Boost contain caffeine?", "No. Rapid Boost does not contain caffeine."],
    ["Can women take Power Max or Rapid Boost?", "Power Max and Rapid Boost are made for men. For women, we recommend Her Power or Daily Vitality."],
    ["Are your products vegan and non-GMO?", "Yes. All four formulas use vegan capsules and non-GMO ingredients."],
  ]],
  ["How to Use", [
    ["How do I take MWP supplements?", "Power Max, Rapid Boost and Her Power: take 3 capsules daily with a meal. Daily Vitality: take 2 capsules daily with a meal. Do not take more than the recommended serving."],
    ["Can I take the capsules on an empty stomach?", "We recommend taking them with a meal, as shown on the label."],
    ["What if I miss a day?", "Just take your next serving as usual. Do not double up."],
    ["Can I take more than one MWP product together?", "Some ingredients appear in more than one formula, such as vitamin D, ashwagandha, ginseng and saffron. Please check with your doctor before combining products."],
    ["How soon will I notice a difference?", "Everyone is different, and we do not promise specific results. Supplements work best as part of a daily routine with good sleep, healthy food and regular activity."],
  ]],
  ["Safety", [
    ["Who should not take MWP supplements?", "Our products are for adults 18 and older. If you are pregnant, nursing, taking medication or have a medical condition, talk to a healthcare professional before use."],
    ["I take medication. Can I use MWP products?", "Ask your doctor first. Some ingredients may not be right for people who take blood pressure, blood thinner, blood sugar or thyroid medication. Each label lists its own warnings."],
    ["I am a tested athlete. Can I use MWP products?", "Check every ingredient on the label with your sports organization before use."],
    ["How should I store my bottle?", "Store in a cool, dry place and keep out of reach of children. Use within 1 month after opening. Do not use if the safety seal is broken or missing."],
    ["Where can I find the expiration date?", "The lot number and expiration date are printed on the bottle."],
  ]],
  ["Orders and Shipping", [
    ["How fast do you ship?", "Orders are processed within 1–2 business days, excluding weekends and holidays. During busy launches or promotions, dispatch can take up to 72 hours."],
    ["How much is shipping?", "Shipping is calculated for your address and shown in USD at checkout, before you pay."],
    ["How do I track my order?", "Once your order ships, you will get an email with the carrier, tracking number and a tracking link. You can also check your order under Track Order in your account."],
    ["What payment methods do you accept?", "Payments are processed securely by Stripe. We never store your full card number."],
    ["Can I cancel my order?", "Yes, free of charge, before your order is packed and shipped. Email support@mwpsupplements.com with your order number. Once it ships, it cannot be cancelled."],
  ]],
  ["Returns and Refunds", [
    ["Can I return my order?", "For health and safety, opened or unsealed containers cannot be returned. We also cannot accept returns for change of mind or for ordering the wrong product."],
    ["My order arrived damaged or incorrect. What do I do?", "Do not accept a parcel that looks punctured, torn or re-taped. Otherwise, record one uncut unboxing video, starting with the shipping label and ending with the bottle and safety seal clearly visible. Email the video and your order number to support@mwpsupplements.com within 7 days of delivery. Approved replacements ship at no cost."],
    ["How do refunds work?", "If an approved replacement is not available, you will get a full refund to your original payment method, normally within 5–7 business days of approval. Your bank may take a few extra days."],
  ]],
  ["Contact", [
    ["How can I contact MWP?", `Email support@mwpsupplements.com or call ${PHONE}, Monday–Friday, 9 AM–6 PM PT. You can also use the Contact Us page.`],
  ]],
];

const old = await prisma.fAQ.findMany();
fs.mkdirSync("backups", { recursive: true });
const backup = path.join("backups", `faqs-before-${Date.now()}.json`);
fs.writeFileSync(backup, JSON.stringify(old, null, 2));
console.log("Old FAQs saved:", backup, `(${old.length})`);

await prisma.fAQ.deleteMany({});
let order = 0;
for (const [category, items] of FAQS) {
  for (const [question, answer] of items) {
    await prisma.fAQ.create({ data: { category, question, answer, order: order++, isPublished: true } });
  }
}
console.log(`Imported ${order} FAQs in ${FAQS.length} sections.`);
await prisma.$disconnect();
