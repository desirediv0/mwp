// Partners earn their commission when an order is DELIVERED (not when it is paid).
// Used by the admin status update and by the carrier tracking webhook.
export async function createDeliveryCommissions(tx, order) {
  if (!order.couponId) return;
  try {
    // Never pay twice for the same order
    const existing = await tx.partnerEarning.findMany({ where: { orderId: order.id } });
    if (existing.length > 0) return;

    // Final order amount (subtotal - discount)
    const finalOrderAmount = parseFloat(order.subTotal) - parseFloat(order.discount);

    const couponPartners = await tx.couponPartner.findMany({
      where: { couponId: order.couponId },
      include: { partner: true },
    });

    for (const couponPartner of couponPartners) {
      if (couponPartner.commission && couponPartner.commission > 0 && finalOrderAmount > 0) {
        const commissionAmount = (finalOrderAmount * couponPartner.commission) / 100;

        await tx.partnerEarning.create({
          data: {
            partnerId: couponPartner.partnerId,
            orderId: order.id,
            couponId: order.couponId,
            amount: commissionAmount.toFixed(2),
            percentage: couponPartner.commission,
            createdAt: new Date(),
          },
        });

        console.log(
          `Created commission for partner ${couponPartner.partner.name}: $${commissionAmount.toFixed(2)} (${couponPartner.commission}% of $${finalOrderAmount.toFixed(2)})`
        );
      }
    }
  } catch (commissionError) {
    console.error("Error creating partner commissions on delivery:", commissionError);
  }
}
