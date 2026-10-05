// Variant artwork takes precedence; otherwise use the admin-managed product image.
export function getPrimaryProductImage(variant) {
  const primary = images => images?.find(image => image.isPrimary) || images?.[0];
  return primary(variant?.images)?.url
    || primary(variant?.product?.images)?.url
    || variant?.product?.image
    || null;
}
