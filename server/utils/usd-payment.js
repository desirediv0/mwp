export const STORE_CURRENCY = 'USD';
export function getUsdPaymentError(payment, orderId, total) {
  if (payment.currency !== STORE_CURRENCY) return 'Payment currency does not match USD checkout';
  if (payment.order_id !== orderId) return 'Payment does not belong to this checkout';
  if (payment.status !== 'captured') return 'Payment has not been captured yet';
  if (!Number.isFinite(Number(total)) || Number(payment.amount) !== Math.round(Number(total) * 100)) return 'Payment amount does not match your cart. Please contact support.';
  return null;
}
