import 'dotenv/config';
import fs from 'node:fs/promises';
import pg from 'pg';
import { prisma } from '../config/db.js';
const pricing = {
  'ultra-pro': [59.99, 49.99], 'power-max': [49.99, 39.99],
  'rapid-boost': [54.99, 44.99], 'her-power': [49.99, 39.99],
  'her-energy': [44.99, 34.99], 'daily-vitality': [39.99, 29.99],
  'alpha-prime': [59.99, 49.99], 'titan-force': [54.99, 44.99],
};
const apply = process.argv.includes('--apply');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (apply) {
    // Run the checked-in additive migration through pg where Windows cannot spawn Prisma's schema engine.
    const migrationName = '20261005120000_store_usd_currency';
    const sql = await fs.readFile(`prisma/migrations/${migrationName}/migration.sql`, 'utf8');
    const conn = await pool.connect();
    try {
      await conn.query('BEGIN');
      const existing = await conn.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'currency'");
      if (!existing.rowCount) {
        await conn.query(sql);
      }
      await conn.query('COMMIT');
    } catch (error) { await conn.query('ROLLBACK'); throw error; }
    finally { conn.release(); }
  }
  const products = await prisma.product.findMany({ where: { slug: { in: Object.keys(pricing) } }, include: { variants: true } });
  if (products.length !== 8) throw new Error('Expected all eight MWP products.');
  if (apply) {
    await fs.mkdir('backups', { recursive: true });
    await fs.writeFile(`backups/usd-pricing-${Date.now()}.json`, JSON.stringify(products, null, 2));
    await prisma.$transaction(async tx => {
      for (const product of products) {
        const [price, salePrice] = pricing[product.slug];
        await tx.productVariant.updateMany({ where: { productId: product.id }, data: { price, salePrice } });
        if (!product.shippingReturn) await tx.product.update({ where: { id: product.id }, data: { shippingReturn: 'Shipping availability and any charges are confirmed at checkout. Delivery estimates depend on your address. See our shipping and returns policies for details.' } });
      }
    });
  }
  console.log(JSON.stringify({ applied: apply, currency: 'USD', pricing }, null, 2));
} finally { await prisma.$disconnect(); await pool.end(); }
