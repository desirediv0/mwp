// Static content transcribed from the four supplied MWP Ingredient Library previews.
// Photo positions refer to the square photographs on each original page.
const rows = [
  [
    ["KSM-66 Ashwagandha", "India", "Supports resilience, a healthy stress response, calm energy, recovery, and performance."],
    ["Shilajit Extract 50%", "India", "Mineral-rich botanical support for vitality, stamina, and performance."],
    ["Tongkat Ali 100:1", "Malaysia", "Traditional root extract for male vitality, drive, and performance."],
    ["Fenugreek Extract 60%", "India", "Traditional seed extract supporting healthy metabolism and vitality."],
    ["Zinc Bisglycinate", "USA", "Gentle zinc form supporting immune health and cellular function."],
    ["Boron Glycinate", "USA", "Trace mineral support for mineral balance and wellness."],
    ["Vegan/Lichen Vitamin D3", "USA", "Vegan vitamin D supporting bones, muscles, and immune function."],
    ["Vitamin K2 MK-7", "Japan", "Long-lasting K2 form supporting bone and cardiovascular wellness."],
  ],
  [
    ["L-Selenomethionine", "USA", "Bioavailable selenium supporting antioxidant protection and thyroid function."],
    ["Saffron Extract 5% Crocin", "Iran", "Premium botanical supporting mood and emotional wellness."],
    ["L-Citrulline Malate 2:1", "USA", "Supports healthy blood flow, exercise performance, stamina, and endurance."],
    ["Panax Ginseng Root Extract", "South Korea", "Root extract supporting energy, focus, stamina, and performance."],
    ["Black Maca Root Extract 4:1", "Peru", "Root extract supporting energy, stamina, vitality, and performance."],
    ["Pomegranate Extract", "India", "Polyphenol-rich extract supporting antioxidant protection and circulation."],
    ["Ginkgo Biloba Extract", "Germany", "Leaf extract supporting circulation, focus, memory, and alertness."],
    ["Zinc Citrate", "USA", "Zinc form supporting immune health and cellular function."],
  ],
  [
    ["L-Citrulline Free-Form", "USA", "Amino acid support for blood flow, workout performance, and stamina."],
    ["L-Arginine Base", "Japan", "Supports nitric oxide production, blood flow, and physical performance."],
    ["French Maritime Pine Bark Ex", "France", "Polyphenol-rich extract supporting antioxidant protection and circulation."],
    ["Myo-Inositol", "USA", "Nutrient supporting women’s metabolic wellness and cellular signaling."],
    ["D-Chiro Inositol", "USA", "Complementary inositol form for women’s wellness and metabolic support."],
    ["Shatavari Root Extract", "India", "Traditional women’s wellness herb supporting vitality and balance."],
    ["Magnesium Glycinate", "USA", "Gentle magnesium supporting muscles, relaxation, and energy metabolism."],
    ["Vitamin B6 P-5-P", "USA", "Active B6 supporting energy metabolism and nervous-system function."],
  ],
  [
    ["Chromium Picolinate", "USA", "Trace mineral supporting healthy glucose metabolism."],
    ["Rhodiola rosea Extract", "Sweden", "Adaptogenic root supporting energy, focus, and stress response."],
    ["Cordyceps CS-4 Extract", "China", "Mushroom extract supporting energy, stamina, and exercise performance."],
    ["CoQ10 Ubiquinol", "Japan", "Active CoQ10 supporting cellular energy and cardiovascular wellness."],
    ["Iron Bisglycinate", "USA", "Gentle iron supporting red blood cell formation and energy."],
    ["Vitamin B12 Methylcobalamin", "USA", "Active B12 supporting energy metabolism, nerves, and red blood cells."],
    ["Berberine Phytosome", "Italy", "Specialized berberine supporting glucose and cardiovascular wellness."],
    ["Quercetin Phytosome", "Italy", "Plant flavonoid providing antioxidant and immune wellness support."],
  ],
];

export const INGREDIENT_LIBRARY = rows.flatMap((pageRows, pageIndex) =>
  pageRows.map(([name, origin, description], index) => ({
    id: `${pageIndex + 1}-${index + 1}`,
    name,
    origin,
    description,
    page: pageIndex + 1,
    photoX: index % 2 === 0 ? 114 : 678,
    photoY: (pageIndex === 0 ? 256 : 142) + Math.floor(index / 2) * 302,
  }))
);
