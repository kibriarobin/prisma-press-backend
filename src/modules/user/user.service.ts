import { prisma } from "../../lib/prisma";
import config from "../../config";
import bcrypt from "bcryptjs";
import { RegisterUserPayload } from "./user.interface";

const registerUserIntoDB = async (payload: RegisterUserPayload) => {
  const { name, email, password, profilePhoto } = payload;

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  // if (isUserExists) {
  //   throw new Error("User already exists with this email");
  // }

  const hashPassword = await bcrypt.hash(
    password,
    Number(config.BCRYPT_SALT_ROUNDS),
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashPassword,
      profile: {
        create: {
          profilePhoto,
        },
      },
    },
  });

  // await prisma.profile.create({
  //   data: {
  //     userId: createdUser.id,
  //     profilePhoto,
  //   },
  // });

  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
      email: createdUser.email || email,
    },
    omit: { password: true },
    include: {
      profile: true,
    },
  });
  return user;
};

const getMyProfileFromDB = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    omit: { password: true },
    include: {
      profile: true,
    },
  });
  return user;
};

const updateMyProfileIntoDB = async (userId: string, payload: any) => {
  const { name, email, profilePhoto, bio } = payload;

  const updateUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      profile: {
        update: {
          profilePhoto,
          bio,
        },
      },
    },
    omit: { password: true },
    include: { profile: true },
  });
  
  return updateUser;
};

export const userService = {
  registerUserIntoDB,
  getMyProfileFromDB,
  updateMyProfileIntoDB,
};
