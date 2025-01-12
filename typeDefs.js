import { gql } from "apollo-server-express";

const typeDefs = gql`
  type Query {
    users: [User]
    user(id: ID!): User
    messagesByUser(receiverId:Int!):[Message]
  }

  input UserInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
  }

  input SigninUserInput{
  email:String!
  password:String!
  }

  type Token {
  token:String!
  }

  scalar Date

  type Message{
  id: ID!
  text: String!
  receiverId: Int!
  senderId: Int!
  createdAt: Date!
  }

  type Mutation {
    signupUser(userNew: UserInput!): User
    signinUser(userSignin:SigninUserInput!):Token
    createMessage(receiverId:Int!,text:String!):Message
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
  }

  type Subscription{
  messageAdded:Message
  }
`;
export default typeDefs;