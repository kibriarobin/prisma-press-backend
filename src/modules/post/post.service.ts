import { prisma } from "../../lib/prisma";
import { ICreatePostPayload, IUpdatePostPayload } from "./post.interface";

const createPostIntoDB = async (
  payload: ICreatePostPayload,
  userId: string,
) => {
  const result = await prisma.post.create({
    data: {
      ...payload,
      authorId: userId,
    },
  });

  return result;
};

const getAllPostFromDB = async () => {
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      comments: true,
    },
  });

  return posts;
};

const getPostByIdFromDB = async (postId: string) => {
  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
  });

  const updatePostViewsCount = await prisma.post.update({
    where: {
      id: postId,
    },

    data: {
      views: {
        increment: 1,
      },
    },

    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      comments: true,
    },
  });

  return updatePostViewsCount;
};

const getMyPostFromDB = async (authorId: string) => {
  const posts = await prisma.post.findMany({
    where: {
      authorId,
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      comments: true,
      author: {
        select: {
          name: true,
          email: true,
        },
      },

      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return posts;
};

const updatePostIntoDB = async (
  postId: string,
  payload: IUpdatePostPayload,
  authorId: string,
  isAdmin: boolean,
) => {
  const post = await prisma.post.findFirstOrThrow({
    where: {
      id: postId,
    },
  });

  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("You don't have permission to update this post");
  }

  const result = await prisma.post.update({
    where: {
      id: postId,
    },
    data: payload,
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      comments: true,
    },
  });

  return result;
};

const deletePostFromDB = async (
  postId: string,
  authorId: string,
  isAdmin: boolean,
) => {
  const post = await prisma.post.findFirstOrThrow({
    where: {
      id: postId,
    },
  });

  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("You don't have permission to delete this post");
  }

  await prisma.post.delete({
    where: {
      id: postId,
    },
  });
};

const getPostStatsFromDB = () => {};

export const postService = {
  createPostIntoDB,
  getAllPostFromDB,
  getPostByIdFromDB,
  updatePostIntoDB,
  deletePostFromDB,
  getPostStatsFromDB,
  getMyPostFromDB,
};
