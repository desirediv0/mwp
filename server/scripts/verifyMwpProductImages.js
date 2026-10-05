import 'dotenv/config';
import assert from 'node:assert/strict';
import { prisma } from '../config/db.js';
import { getFileUrl } from '../utils/deleteFromS3.js';
import { getPrimaryProductImage } from '../utils/product-image.js';

const slugs = ['ultra-pro', 'power-max', 'rapid-boost', 'her-power', 'her-energy', 'daily-vitality', 'alpha-prime', 'titan-force'];
const usdPrices = { 'ultra-pro': 49.99, 'power-max': 39.99, 'rapid-boost': 44.99, 'her-power': 39.99, 'her-energy': 34.99, 'daily-vitality': 29.99, 'alpha-prime': 49.99, 'titan-force': 44.99 };
const api = 'http://localhost:4000/api/public';
async function json(endpoint) {
  const response = await fetch(`${api}${endpoint}`, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, endpoint);
  return response.json();
}
try {
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } }, include: { images: true, variants: { include: { images: true } } } });
  assert.equal(products.length, slugs.length);
  for (const product of products) {
    const image = product.images.find(image => image.isPrimary);
    assert.ok(image?.url.endsWith(`${product.slug}.webp`));
    const response = await fetch(getFileUrl(image.url), { method: 'HEAD', signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /image\/webp/);
    for (const variant of product.variants) assert.equal(getPrimaryProductImage({ ...variant, product }), image.url);
  }
  console.log('PASS: eight DB primaries, public image URLs, WebP types and cart/order image selection.');
  const listing = await json('/products?limit=100');
  for (const slug of slugs) assert.ok(listing.data.products.find(product => product.slug === slug)?.image?.endsWith(`${slug}.webp`));
  for (const slug of slugs) {
    const detail = (await json(`/products/${slug}`)).data.product;
    assert.equal(Number(detail.variants[0].salePrice), usdPrices[slug], slug);
    const variant = (await json(`/products/variants/${detail.variants[0].id}`)).data.variant;
    assert.equal(Number(variant.salePrice), usdPrices[slug]);
    const ingredientsResponse = await fetch(`http://localhost:4000/api/ingredients/product/${detail.id}`);
    assert.equal(ingredientsResponse.status, 200);
    const ingredients = (await ingredientsResponse.json()).data.ingredients;
    assert.equal(ingredients.length, detail.ingredientItems.length);
  }
  const settingsResponse = await fetch('http://localhost:4000/api/payment/settings');
  const settings = (await settingsResponse.json()).data;
  assert.equal(settings.currency, 'USD');
  assert.equal(settings.phonepeEnabled, false);
  const columns = await prisma.$queryRaw`SELECT column_default FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'currency'`;
  assert.match(columns[0].column_default, /USD/);
  console.log(`PASS: eight USD prices, ingredient APIs, checkout currency and USD order default; online payment configured: ${settings.razorpayEnabled}.`);
  const detail = await json('/products/daily-vitality');
  const product = detail.data.product;
  assert.ok(product.images.find(image => image.isPrimary)?.url?.endsWith('daily-vitality.webp'));
  const variant = (await json(`/products/variants/${product.variants[0].id}`)).data.variant;
  assert.ok(variant.product.image.endsWith('daily-vitality.webp'));
  for (const slug of ['alpha-prime', 'titan-force']) {
    const detail = (await json(`/products/${slug}`)).data.product;
    assert.ok(detail.images.find(image => image.isPrimary)?.url.endsWith(`${slug}.webp`));
    assert.ok(detail.variants.length > 0);
    assert.ok(Number(detail.variants[0].salePrice || detail.variants[0].price) > 0);
    assert.ok(detail.variants[0].quantity > 0);
    const variant = (await json(`/products/variants/${detail.variants[0].id}`)).data.variant;
    assert.ok(variant.product.image.endsWith(`${slug}.webp`));
  }
  console.log('PASS: live products listing, Daily Vitality detail and guest-cart variant API.');
} finally { await prisma.$disconnect(); }
