import assert from 'node:assert/strict';
const slugs = ['ultra-pro', 'power-max', 'rapid-boost', 'her-power', 'her-energy', 'daily-vitality', 'alpha-prime', 'titan-force'];
for (const slug of slugs) {
  const response = await fetch(`http://localhost:4000/api/public/products/${slug}`, { headers: { Origin: 'http://localhost:3000' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  const product = (await response.json()).data.product;
  const option = product.attributeOptions.find(option => option.name === 'Pack size');
  assert.ok(option);
  assert.ok(option.values.some(v => v.value === (slug === 'power-max' ? '60 tablets' : '60 capsules')));
  for (const variant of product.variants) {
    assert.ok(variant.attributes.some(a => option.values.some(v => v.id === a.attributeValueId)));
    const cartResponse = await fetch(`http://localhost:4000/api/public/products/variants/${variant.id}`);
    assert.equal(cartResponse.status, 200);
    const cartVariant = (await cartResponse.json()).data.variant;
    assert.ok(cartVariant.product.image);
    assert.equal(Number(cartVariant.salePrice), Number(variant.salePrice));
  }
  console.log(`PASS: ${slug} selectable API variant, cart price/image, localhost CORS`);
}
