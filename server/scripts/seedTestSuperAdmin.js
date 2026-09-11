import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";

// Load environment variables
dotenv.config();

/**
 * Creates (or resets) a SUPER_ADMIN account for testing.
 *
 *   Email:    test@gmail.com
 *   Password: Ritesh@123
 *
 * SUPER_ADMIN bypasses every permission check in the admin middleware,
 * so this account effectively has full control. We still seed the explicit
 * permission rows so any UI that reads them shows everything enabled.
 *
 * Run:  npm run seed:test-admin        (from the server/ directory)
 */

const EMAIL = "test@gmail.com";
const PASSWORD = "Ritesh@123";

// Full permission matrix for a SUPER_ADMIN (mirrors fixSuperAdminPermissions.js
// plus the flavor/weight resources used by the supplements catalogue).
const ALL_PERMISSIONS = [];
const RESOURCES = [
  "admins",
  "users",
  "products",
  "orders",
  "categories",
  "subcategories",
  "brands",
  "banners",
  "reviews",
  "settings",
  "inventory",
  "coupons",
  "color",
  "size",
  "flavors",
  "weights",
  "content",
  "faqs",
  "partners",
  "referrals",
  "returns",
  "bundles",
  "flashsales",
  "newsletter",
  "email-marketing",
];
for (const resource of RESOURCES) {
  for (const action of ["create", "read", "update", "delete"]) {
    ALL_PERMISSIONS.push({ resource, action });
  }
}
ALL_PERMISSIONS.push({ resource: "dashboard", action: "read" });

async function seedTestSuperAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    let admin = await prisma.admin.findUnique({
      where: { email: EMAIL },
      include: { permissions: true },
    });

    if (admin) {
      admin = await prisma.admin.update({
        where: { email: EMAIL },
        data: {
          password: hashedPassword,
          role: "SUPER_ADMIN",
          isActive: true,
          firstName: "Test",
          lastName: "SuperAdmin",
        },
        include: { permissions: true },
      });
      console.log(`Updated existing admin ${EMAIL} -> SUPER_ADMIN, password reset.`);
    } else {
      admin = await prisma.admin.create({
        data: {
          email: EMAIL,
          password: hashedPassword,
          firstName: "Test",
          lastName: "SuperAdmin",
          role: "SUPER_ADMIN",
          isActive: true,
        },
        include: { permissions: true },
      });
      console.log(`Created new SUPER_ADMIN ${EMAIL}.`);
    }

    const existing = new Set(
      admin.permissions.map((p) => `${p.resource}:${p.action}`)
    );

    let added = 0;
    for (const perm of ALL_PERMISSIONS) {
      if (existing.has(`${perm.resource}:${perm.action}`)) continue;
      await prisma.permission.create({
        data: { adminId: admin.id, resource: perm.resource, action: perm.action },
      });
      added++;
    }

    console.log(`Permissions: ${existing.size} already present, ${added} added.`);
    console.log("");
    console.log("  Login credentials");
    console.log("  -----------------");
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log(`  Role:     SUPER_ADMIN (full access)`);
  } catch (error) {
    console.error("Error seeding test super admin:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestSuperAdmin();
