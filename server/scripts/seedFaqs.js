import { prisma } from "../config/db.js";

// Starter FAQs written only from confirmed store facts (see policy pages).
// Admin can edit/reorder/delete them from the FAQ manager. Skips existing questions.
const S = "Orders & Shipping";
const P = "Products & Ingredients";
const R = "Returns & Support";

const FAQS = [
  [S, "How do I place an order?", "Choose your formula and pack size, add it to your cart and continue to checkout. Prices are in US dollars, and your shipping options and final total are shown before you pay."],
  [S, "How long until my order ships?", "Orders are processed within 24–48 hours, excluding weekends and holidays. During busy launches or promotions, dispatch can take up to 72 hours."],
  [S, "How can I track my order?", "When your order ships we email you the carrier, your tracking number and a tracking link. You can also see your order status any time from Orders in your account."],
  [S, "How much does shipping cost and how long does delivery take?", "Delivery options, estimated delivery times and any shipping charge are calculated for your address and shown at checkout before you pay."],
  [S, "How do I pay?", "Payments are processed securely by Stripe at checkout. Your card details go straight to Stripe, and MWP never stores your full card number."],
  [P, "Where can I find ingredient information?", "Every product page lists each ingredient with its dose and origin under “Inside the formula”. You can also open the ingredient details from the product page for a closer look."],
  [P, "How do I know my product is genuine?", "Scan the QR code on your MWP pack to open its verification page and confirm the product."],
  [P, "Are MWP supplements third-party lab tested?", "Yes. MWP formulas are third-party lab tested. Available testing and certification documents are published on our Certificate Wall."],
  [P, "Should I talk to a doctor before taking MWP supplements?", "Always follow the directions on the label. Talk to a healthcare professional first if you are pregnant or nursing, take medication or have a medical condition. These products are dietary supplements and are not intended to diagnose, treat, cure or prevent any disease."],
  [R, "What if my order arrives damaged or incorrect?", "Record an unboxing video before opening the parcel and email it with your order number to support@mwpsupplements.com within 48 hours of delivery. If approved, we send a replacement as a priority."],
  [R, "Can I return an opened product?", "For health and safety reasons, opened, unsealed or partially used supplement containers cannot be returned. See our Returns & Replacement Policy for the full details."],
  [R, "Can I cancel my order?", "Yes, free of charge, as long as it has not been packed and shipped. Email support@mwpsupplements.com with your order number as soon as possible."],
  [R, "How do I contact support?", "Email support@mwpsupplements.com or call 562-524-3557, Monday–Friday, 9:00 AM–6:00 PM. You can also use the contact form on our Contact page."],
];

async function main() {
  for (let i = 0; i < FAQS.length; i++) {
    const [category, question, answer] = FAQS[i];
    const exists = await prisma.fAQ.findFirst({ where: { question } });
    if (exists) {
      console.log(`= skipped: ${question}`);
      continue;
    }
    await prisma.fAQ.create({ data: { category, question, answer, order: i, isPublished: true } });
    console.log(`+ ${question}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
