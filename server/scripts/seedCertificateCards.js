import { prisma } from "../config/db.js";

// Creates the six default certificate-wall cards (no documents attached yet).
// The admin attaches PDFs later from Certificates. Skips titles that exist.
const CARDS = [
  { title: "FDA Facility Registration", heading: "FDA Registered Facility", badge: "✓", summary: "Facility registration and manufacturing documentation.", description: "Manufacturing environment documentation for customer review.", buttonLabel: "View certificate" },
  { title: "cGMP Compliance", heading: "cGMP Compliance", badge: "GMP", summary: "Good Manufacturing Practice standards and quality controls.", description: "Quality systems designed for consistent manufacturing.", buttonLabel: "View certificate" },
  { title: "Certificate of Analysis", heading: "Third-Party Lab Tested", badge: "COA", summary: "Independent testing documentation for product quality.", description: "View available product testing and laboratory records.", buttonLabel: "View COA" },
  { title: "Non-GMO Documentation", heading: "Non-GMO", badge: "NG", summary: "Ingredient and product documentation supporting non-GMO standards.", description: "Clear information about ingredient standards and sourcing.", buttonLabel: "View document" },
  { title: "Halal Certification", heading: "Halal Certification", badge: "H", summary: "Certification documentation for applicable products and materials.", description: "View the certification document and scope details.", buttonLabel: "View certificate" },
  { title: "Quality Documentation", heading: "Quality Standard", badge: "NSF", summary: "Quality and testing documentation displayed for transparency.", description: "Supporting documentation will be added as approved.", buttonLabel: "View document" },
];

async function main() {
  for (let i = 0; i < CARDS.length; i++) {
    const exists = await prisma.certificate.findFirst({ where: { title: CARDS[i].title } });
    if (exists) {
      console.log(`= ${CARDS[i].title}: exists, skipped`);
      continue;
    }
    await prisma.certificate.create({ data: { ...CARDS[i], displayOrder: i, isActive: true } });
    console.log(`+ ${CARDS[i].title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
