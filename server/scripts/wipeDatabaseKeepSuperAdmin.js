import dotenv from "dotenv";
import { prisma } from "../config/db.js";

dotenv.config();

// DESTRUCTIVE: wipes every row from every table in the database EXCEPT the
// one Admin row matching KEEP_ADMIN_EMAIL. Requires explicit confirmation
// via the CONFIRM_WIPE=YES env var so this can never run by accident.
//
// Run:  CONFIRM_WIPE=YES node -r dotenv/config scripts/wipeDatabaseKeepSuperAdmin.js
const KEEP_ADMIN_EMAIL = process.env.KEEP_ADMIN_EMAIL || "admin@mwpsupplements.com";

async function wipeDatabase() {
  if (process.env.CONFIRM_WIPE !== "YES") {
    console.error("Refusing to run: set CONFIRM_WIPE=YES to confirm this destroys ALL data.");
    process.exitCode = 1;
    return;
  }

  const keepAdmin = await prisma.admin.findUnique({ where: { email: KEEP_ADMIN_EMAIL } });
  if (!keepAdmin) {
    console.error(`Admin "${KEEP_ADMIN_EMAIL}" not found — aborting so nothing is lost.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Keeping admin: ${keepAdmin.email} (${keepAdmin.id})`);

  // Get every table name Prisma knows about via the DB catalog, so this
  // stays correct even as the schema grows — no per-model list to maintain.
  const tables = await prisma.$queryRawUnsafe(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
  `);

  const tableNames = tables.map((t) => t.tablename);
  if (!tableNames.includes("Admin")) {
    console.error('"Admin" table not found in public schema — aborting.');
    process.exitCode = 1;
    return;
  }

  const otherTables = tableNames.filter((t) => t !== "Admin");

  console.log(`Truncating ${otherTables.length} tables (all except "Admin")...`);
  if (otherTables.length > 0) {
    const quoted = otherTables.map((t) => `"${t}"`).join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
  }

  console.log('Removing every Admin row except the one being kept...');
  const deleted = await prisma.admin.deleteMany({ where: { id: { not: keepAdmin.id } } });
  console.log(`Deleted ${deleted.count} other admin(s).`);

  const remaining = await prisma.admin.findMany({ select: { email: true, role: true } });
  console.log("");
  console.log("==================================================");
  console.log("  Database wiped. Remaining admins:");
  console.log("==================================================");
  for (const a of remaining) console.log(`  ${a.email} (${a.role})`);
}

wipeDatabase()
  .catch((err) => {
    console.error("Wipe failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
