import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PubSub } from 'graphql-subscriptions';

const pubsub=new PubSub();
dotenv.config();
const prisma = new PrismaClient();

const MESSAGE_ADDED = 'MESSAGE_ADDED'
const JWT_SECRET = process.env.JWT_SECRET;

const resolvers = {
  Query: {
    users: async (_, args, { userId, prisma }) => {
      if (!userId) throw new ForbiddenError("You must be logged in");

      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          id: {
            not: userId,
          },
        },
      });

      return users;  // Added return statement
    },
    messagesByUser:async(_,{receiverId},{userId,prisma})=>{
      if (!userId) throw new ForbiddenError("You must be logged in");
     const messages= await prisma.message.findMany({
        where:{
          OR:[
            {senderId:userId,receiverId:receiverId},
            {senderId:receiverId,receiverId:userId}
          ]
        },
        orderBy:{
          createdAt:"asc"
        }
      })
      return messages
    }
  },
  Mutation: {
    signupUser: async (_, { userNew }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { email: userNew.email } });
      if (user) throw new AuthenticationError("User already exists!");

      const hashedPassword = await bcrypt.hash(userNew.password, 10);
      const newUser = await prisma.user.create({
        data: {
          ...userNew,
          password: hashedPassword,
        },
      });

      return newUser;
    },

    signinUser: async (_, { userSignin }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { email: userSignin.email } });
      if (!user) throw new AuthenticationError("User doesn't exist!");

      const isMatch = await bcrypt.compare(userSignin.password, user.password);
      if (!isMatch) throw new AuthenticationError("Invalid credentials!");

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      return { token };
    },

    createMessage: async (_, {receiverId, text }, { userId, prisma }) => {
      if (!userId) throw new ForbiddenError("You must be logged in");
                console.log("Prisma message model:", prisma.message);

      const message = await prisma.message.create({
        data: {
          text,
          receiverId,
          senderId: userId,
        }
      })
      pubsub.publish(MESSAGE_ADDED,{messageAdded:message})

      return message;
    },
  },
  Subscription:{
    messageAdded:{
        subscribe:()=>pubsub.asyncIterator()
    }
  }
};

export default resolvers;
