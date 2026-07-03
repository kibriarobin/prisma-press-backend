import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { handleChangeSubscription, handleCheckoutSessionCompleted } from "./subscription.utils";

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
      await handleCheckoutSessionCompleted(event.data.object);

      break;
    case "customer.subscription.updated":
      await handleChangeSubscription(event.data.object);

      break;
    case "customer.subscription.deleted":
      await handleChangeSubscription(event.data.object);

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
