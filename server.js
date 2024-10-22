import { ApolloServer, AuthenticationError } from 'apollo-server';
import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;



import dotenv from 'dotenv';
dotenv.config(); // Load environment variables


const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const { authorization } = req.headers;
    const context = { prisma }; // Prisma should be added here

    if (authorization) {
      try {
        const token = authorization.replace('Bearer ', '');
        const { userId } = jwt.verify(token, JWT_SECRET);  
        context.userId = userId; // Add userId to the context if the token is valid
      } catch (err) {
        throw new AuthenticationError('Invalid/Expired token');
      }
    }

    return context; // Return context containing both prisma and userId (if available)
  },
});

server.listen().then(({ url }) => {
  console.log(`Server is ready at ${url}`);
});
