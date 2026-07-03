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

const handleWebhook = async (payload: Buffer, signature: string) => {
  const endpointSecret = config.STRIPE_WEBHOOK_SECRET;
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    endpointSecret,
  );

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
        throw new Error("Webhook failed");
      }

      const stripeSubscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);

      const currentPeriodStartInMilliSeconds =
        stripeSubscription.items.data[0]?.current_period_start!;
      const currentPeriodStart = new Date(
        currentPeriodStartInMilliSeconds * 1000,
      );

      const currentPeriodEndInMilliSeconds =
        stripeSubscription.items.data[0]?.current_period_end!;
      const currentPeriodEnd = new Date(currentPeriodEndInMilliSeconds * 1000);

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId,
          stripeSubscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
        },
        update: {
          stripeCustomerId,
          stripeSubscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
        },
      });

      break;
    case "customer.subscription.updated":
      const paymentMethod = event.data.object;

      break;
    case "customer.subscription.deleted":
      break;
    default:
      // Unexpected event type
      console.log(`No events matched. unhandled event type ${event.type}.`);
      break;
  }
};

export const subscriptionService = {
  createCheckoutSession,
  handleWebhook,
};
