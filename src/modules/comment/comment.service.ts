import { prisma } from "../../lib/prisma";
import {
  ICreateCommentPayload,
  IModerateCommentPayload,
  IUpdateCommentPayload,
} from "./comment.interface";

const createCommentIntoDB = async (
  payload: ICreateCommentPayload,
  authorId: string,
) => {
  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: payload.postId,
    },
  });

  const result = await prisma.comment.create({
    data: {
      ...payload,
      authorId,
    },
  });

  return result;
};

const getCommentByAuthorIdFromDB = async (authorId: string) => {
  const result = await prisma.comment.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getCommentByCommentIdFromDB = async (commentId: string) => {
  const result = await prisma.comment.findUniqueOrThrow({
    where: {
      id: commentId,
    },
    include: {
      post: {
        select: {
          title: true,
          status: true,
        },
      },
      author: {
        select: {
          name: true,
        },
      },
    },
  });

  return result;
};

const updateCommentIntoDB = async (
  commentId: string,
  authorId: string,
  payload: IUpdateCommentPayload,
) => {
  const comment = await prisma.comment.findUniqueOrThrow({
    where: {
      id: commentId,
    },
  });

  if (comment.authorId !== authorId) {
    throw new Error("You don't have permission to update this comment");
  }

  const result = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: payload,
  });

  return result;
};

const deleteCommentFromDB = async (
  commentId: string,
  authorId: string,
  isAdmin: boolean,
) => {
  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  if (!isAdmin && comment.authorId !== authorId) {
    throw new Error("You don't have permission to delete this comment");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });
};

const moderateCommentIntoDB = async (
  commentId: string,
  payload: IModerateCommentPayload,
) => {
  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  const result = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      status: payload.status,
    },
  });

  return result;
};

export const commentService = {
  createCommentIntoDB,
  getCommentByAuthorIdFromDB,
  getCommentByCommentIdFromDB,
  updateCommentIntoDB,
  deleteCommentFromDB,
  moderateCommentIntoDB,
};
