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

const getAllPostFromDB = () => {};

const getPostByIdFromDB = () => {};

const updatePostIntoDB = () => {};

const deletePostFromDB = () => {};

const getPostStatsFromDB = () => {};

const getMyPostFromDB = () => {};

export const postService = {
  createPostIntoDB,
  getAllPostFromDB,
  getPostByIdFromDB,
  updatePostIntoDB,
  deletePostFromDB,
  getPostStatsFromDB,
  getMyPostFromDB,
};
