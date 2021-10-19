// index.js
// This is the main entry point of our application
const express = require('express');
const { ApolloServer } = require('apollo-server-express')
require('dotenv').config();
const jwt = require('jsonwebtoken')

// 模組匯入
const db = require('./db');
const models = require('./models')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')

const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST;

const getUser = token => {
  if(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET)
    } catch (e) {
      throw new Error('Session invalid')
    }
  }
}

const app = express();

db.connect(DB_HOST)

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // 從標頭取得使用者權杖
    const token = req.headers.authorization;
    // 嘗試使用權杖擷取使用者
    const user = getUser(token);

    console.log(user);
    // 將DB模型和使用者新增至context
    return { models, user }
  }
})

server.applyMiddleware({ app, path: '/api' })

// app.get('/', (req, res) => res.send('Hello, world!'));

app.listen(port, ()=> console.log(`GraphQL Server running at http://localhost:${port}${server.graphqlPath}`))