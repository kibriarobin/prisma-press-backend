import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { SubscriptionStatus } from "../../../generated/prisma/enums";

export const getPeriodStart = (payload: Stripe.Subscription) => {
  const currentPeriodStartInMilliSeconds =
    payload.items.data[0]?.current_period_start!;
  const currentPeriodStart = new Date(currentPeriodStartInMilliSeconds * 1000);

  return currentPeriodStart;
};

export const getPeriodEnd = (payload: Stripe.Subscription) => {
  const currentPeriodEndInMilliSeconds =
    payload.items.data[0]?.current_period_end!;
  const currentPeriodEnd = new Date(currentPeriodEndInMilliSeconds * 1000);

  return currentPeriodEnd;
};

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const userId = session.metadata?.userId;
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;

  console.log("session metadata:", session.metadata); 
  console.log("stripeCustomerId:", session.customer);
  console.log("stripeSubscriptionId:", session.subscription);

  if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
    console.log("Missing value for checkout session.");
    return;
  }

  const stripeSubscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  const currentPeriodStart = getPeriodStart(stripeSubscription);
  const currentPeriodEnd = getPeriodEnd(stripeSubscription);

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
};

export const handleChangeSubscription = async (payload: Stripe.Subscription) => {
  const stripeSubscriptionId = payload.id;
  const subscriptionStatus =
    payload.status === "active" || payload.status === "trialing"
      ? SubscriptionStatus.ACTIVE
      : payload.status === "canceled"
        ? SubscriptionStatus.CANCELED
        : SubscriptionStatus.EXPIRED;

  const currentPeriodStart = getPeriodStart(payload);
  const currentPeriodEnd = getPeriodEnd(payload);

  const isSubscriptionIdExist = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId,
    },
  });

  if (!isSubscriptionIdExist) {
    console.log(
      `Webhook: No subscription found for subscription id : ${stripeSubscriptionId}`,
    );

    return;
  }

  await prisma.subscription.update({
    where: {
      stripeSubscriptionId,
    },
    data: {
      status:subscriptionStatus,
      currentPeriodEnd,
    },
  });
};