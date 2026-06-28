import { Router } from "express";
import { postController } from "./post.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  auth(Role.USER, Role.AUTHOR, Role.ADMIN),
  postController.createPost,
);

router.get("/", postController.getAllPost);

router.get("/stats", auth(Role.ADMIN), postController.getPostStats);

router.get(
  "/my-posts",
  auth(Role.USER, Role.AUTHOR, Role.ADMIN),
  postController.getMyPost,
);

router.get(
  "/:postId",
  auth(Role.USER, Role.AUTHOR, Role.ADMIN),
  postController.getPostById,
);

router.patch(
  "/:postId",
  auth(Role.USER, Role.AUTHOR, Role.ADMIN),
  postController.updatePost,
);

router.delete(
  "/postId",
  auth(Role.USER, Role.AUTHOR, Role.ADMIN),
  postController.deletePost,
);

export const postRoutes = router;
