import app from "./app.js";
import dotenv from "dotenv";
import { prisma } from "./config/db.js";

dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 4004;

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Application should continue running despite unhandled promises
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Give server time to handle ongoing requests before shutting down
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    console.log("Database disconnected successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Auto-seed default homepage sections if they don't exist
const seedDefaultSections = async () => {
  try {
    const defaults = [
      { name: "Featured Collections", slug: "featured", description: "Handpicked handcrafted jewellery pieces selected for your style", color: "bg-blue-500", displayOrder: 1 },
      { name: "Latest Additions", slug: "latest", description: "Newly added premium jewellery collections", color: "bg-green-500", displayOrder: 2 },
      { name: "Best Sellers", slug: "bestseller", description: "Our most popular jewellery designs loved by clients across India", color: "bg-yellow-500", displayOrder: 3 },
      { name: "Trending Now", slug: "trending", description: "Most loved and trending handmade designs and accessories this week", color: "bg-purple-500", displayOrder: 4 },
      { name: "New Arrivals", slug: "new", description: "Fresh handcrafted creations added to our gallery", color: "bg-pink-500", displayOrder: 5 },
    ];

    for (const s of defaults) {
      const existing = await prisma.productSection.findUnique({
        where: { slug: s.slug }
      });
      if (!existing) {
        await prisma.productSection.create({
          data: {
            name: s.name,
            slug: s.slug,
            description: s.description,
            color: s.color,
            displayOrder: s.displayOrder,
            isActive: true
          }
        });
        console.log(`Auto-seeded default section: ${s.name} 🌱`);
      }
    }
  } catch (err) {
    console.error("Error auto-seeding default sections:", err);
  }
};

// Connect to the database and start the server
prisma
  .$connect()
  .then(async () => {
    await seedDefaultSections();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 🚀`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  });
