// Default notes configuration if DB is empty
const DEFAULT_NOTES = {
  base: [
    { id: "b1", category: "Woody", name: "Mysore Sandalwood", description: "Rich, creamy, warm woody accord", color: "#8B5A2B", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80" },
    { id: "b2", category: "Woody", name: "Atlas Cedarwood", description: "Dry, aromatic cedar with earthy undertones", color: "#A0522D", image: "https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80" },
    { id: "b3", category: "Amber", name: "Golden Amber", description: "Sweet, resinous, glowing warmth", color: "#D2691E", image: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80" },
    { id: "b4", category: "Amber", name: "Spiced Resin", description: "Deep balsamic amber infused with clove", color: "#CD853F", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80" },
    { id: "b5", category: "Musky", name: "White Musk", description: "Clean, velvety, skin-like softness", color: "#E6D7FF", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80" },
    { id: "b6", category: "Musky", name: "Noir Musk", description: "Intense, sensual, dark musk note", color: "#9370DB", image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80" },
    { id: "b7", category: "Leathery", name: "Smoked Suede", description: "Supple, soft leather accord", color: "#704214", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80" },
    { id: "b8", category: "Leathery", name: "Tuscan Leather", description: "Rich, opulent, smoky leather", color: "#4A2478", image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80" }
  ],
  heart: [
    { id: "h1", category: "Floral", name: "Rose De Mai", description: "Lush French centifolia rose petal extract", color: "#E65C8B", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" },
    { id: "h2", category: "Floral", name: "Night Jasmine", description: "Intoxicating white floral bouquet", color: "#F0E6FF", image: "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=800&q=80" },
    { id: "h3", category: "Spicy", name: "Royal Cardamom", description: "Warm, aromatic, sweet spice accord", color: "#C79C5E", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80" },
    { id: "h4", category: "Spicy", name: "Pink Pepper", description: "Vibrant, rosy, sparkling spice", color: "#DB7093", image: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80" },
    { id: "h5", category: "Fruity", name: "Wild Fig", description: "Juicy, green, Mediterranean fig leaf", color: "#6B8E23", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80" },
    { id: "h6", category: "Fruity", name: "Blackcurrant", description: "Tart, rich berry notes", color: "#4B0082", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80" },
    { id: "h7", category: "Fresh", name: "Ocean Vetiver", description: "Clean, earthy, aquatic grass accord", color: "#2E8B57", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80" },
    { id: "h8", category: "Fresh", name: "French Lavender", description: "Calming herbal lavender blossoms", color: "#9B72CF", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80" }
  ],
  top: [
    { id: "t1", category: "Citrus", name: "Calabrian Bergamot", description: "Zesty, sun-ripened Italian citrus", color: "#FFD700", image: "https://images.unsplash.com/photo-1534531141161-e41d1341d1de?auto=format&fit=crop&w=800&q=80" },
    { id: "t2", category: "Citrus", name: "Sicilian Mandarin", description: "Sweet, sparkling orange essence", color: "#FFA500", image: "https://images.unsplash.com/photo-1534531141161-e41d1341d1de?auto=format&fit=crop&w=800&q=80" },
    { id: "t3", category: "Green", name: "Crisp Green Tea", description: "Refreshing, herbaceous green leaf", color: "#9ACD32", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80" },
    { id: "t4", category: "Green", name: "Neroli Blossom", description: "Bitter orange flower accord", color: "#F4A460", image: "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=800&q=80" },
    { id: "t5", category: "Aquatic", name: "Marine Mist", description: "Fresh ocean breeze & sea salt notes", color: "#00CED1", image: "https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80" },
    { id: "t6", category: "Aquatic", name: "Dewy Lotus", description: "Pure aquatic water lily", color: "#E0FFFF", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" },
    { id: "t7", category: "Aromatic", name: "Clary Sage", description: "Herbal, amber-tinted sage leaf", color: "#8FBC8F", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80" },
    { id: "t8", category: "Aromatic", name: "Eucalyptus & Mint", description: "Invigorating, crisp herbal lift", color: "#3CB371", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80" }
  ],
  bottles: [
    { id: "bot1", name: "Classic Heritage", capacity: "100 ml", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80", price: 3999, description: "Timeless faceted crystal flacon with gold stopper" },
    { id: "bot2", name: "Minimal Executive", capacity: "100 ml", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80", price: 4299, description: "Sleek cylindrical heavy-glass bottle with magnetic cap" },
    { id: "bot3", name: "Luxury Signature", capacity: "100 ml", image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80", price: 4599, description: "Hand-polished smoked glass flacon with engraved neck" },
    { id: "bot4", name: "Artisan Gold", capacity: "100 ml", image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80", price: 4999, description: "Limited atelier gold-finished luxury bottle" }
  ]
};

import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// GET /api/public/custom-perfume/options
export const getCustomPerfumeOptions = async (req, res) => {
  try {
    const notes = await prisma.customPerfumeNote.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });
    const bottles = await prisma.customPerfumeBottle.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    if (notes.length > 0 || bottles.length > 0) {
      const formattedNotes = notes.map((note) => ({
        ...note,
        image: getFileUrl(note.image)
      }));

      const formattedBottles = bottles.map((bottle) => ({
        ...bottle,
        price: parseFloat(bottle.price),
        image: getFileUrl(bottle.image)
      }));

      const base = formattedNotes.filter((n) => n.noteType === "BASE");
      const heart = formattedNotes.filter((n) => n.noteType === "HEART");
      const top = formattedNotes.filter((n) => n.noteType === "TOP");

      return res.json({
        success: true,
        data: {
          base: base.length > 0 ? base : DEFAULT_NOTES.base,
          heart: heart.length > 0 ? heart : DEFAULT_NOTES.heart,
          top: top.length > 0 ? top : DEFAULT_NOTES.top,
          bottles: formattedBottles.length > 0 ? formattedBottles : DEFAULT_NOTES.bottles
        }
      });
    }

    res.json({
      success: true,
      data: DEFAULT_NOTES
    });
  } catch (error) {
    res.json({
      success: true,
      data: DEFAULT_NOTES
    });
  }
};
