import { ApolloServer, ApolloServer, AuthenticationError } from 'apollo-server-express';
import typeDefs from './typeDefs.js';
import resolvers from './resolvers.js';
import jwt from 'jsonwebtoken';
import  {WebSocketServer} from 'ws';
import {useServer} from 'graphql-ws/lib/use/ws'
import express from 'express';
import {makeExecutableSchema} from '@graphql-tools/schema'
const port = process.env.PORT || 4000;



const app = express();
const context= ({req})=>{
  const {authorization} =req.headers
  if(authorization){
    const {userId} = jwt.verify(authorization,process.env.JWT_SECRET)
    return {userId}
  }
}

const schema = makeExecutableSchema({typeDefs:resolvers})

const ApolloServer=new ApolloServer({schema});


await ApolloServer.start();
ApolloServer.applyMiddleware({app, path:"/graphql"});

const server = app.listen(port,()=>{
  const wsServer =new WebSocketServer({
    server,
    path:'/graphql',
  });
  useServer({schema},wsServer);
})





