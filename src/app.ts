import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import { userRoutes } from "./modules/user/user.route";
import { authRoutes } from "./modules/auth/auth.route";
import { postRoutes } from "./modules/post/post.route";
import { commentRoutes } from "./modules/comment/comment.route";
import { notFound } from "./middleware/notFound";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { subscriptionRoutes } from "./modules/subscription/subscription.route";
import { stripe } from "./lib/stripe";

const app: Application = express();

app.use(
  cors({
    origin: config.APP_URL,
    credentials: true,
  }),
);


app.use("/api/v1/subscriptions/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/posts", postRoutes);

app.use("/api/comments", commentRoutes);

app.use("/api/v1/subscriptions", subscriptionRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
