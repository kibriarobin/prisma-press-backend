import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

const createCheckoutSession = async (userId: string) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: { subscription: true },
    });

    let StripeCustomerId = user.subscription?.stripeCustomerId;

    if (!StripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      StripeCustomerId = customer.id;
    }
    console.log("Price ID:", config.STRIPE_PRODUCT_PRICE_ID);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: config.STRIPE_PRODUCT_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer: StripeCustomerId,
      payment_method_types: ["card"],
      success_url: `${config.APP_URL}/premium?success=true`,
      cancel_url: `${config.APP_URL}/payment?success=false`,
      metadata: { userId: user.id },
    });

    return session.url;
  });

  return {
    paymentUrl: transactionResult,
  };
};

export const subscriptionService = {
  createCheckoutSession,
};
