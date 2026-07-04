import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../lib/prisma";
import { SubscriptionStatus } from "../../generated/prisma/client";

export const subscriptionGuard = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error("Please subscribe to access premium content.");
    }

    if (subscription?.status !== SubscriptionStatus.ACTIVE) {
      throw new Error(
        "Your subscription is not active. Please renew your subscription to access premium content.",
      );
    }

    next();
  });
};
