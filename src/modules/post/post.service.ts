import { prisma } from "../../lib/prisma";
import { ICreatePostPayload } from "./post.interface";

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

const updatePostIntoDB = () => {};

const deletePostFromDB = () => {};

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
