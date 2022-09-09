import express from 'express';
import cors from 'cors';
import db from './database/db.js';
import { signIn, signUp } from './controllers/auth.controllers.js';
import { createTransaction, getUserTransactions } from './controllers/transactions.controller.js';

const server = express();
server.use(express.json());
server.use(cors());

server.post('/auth/sign-up', signUp);
server.post('/auth/sign-in', signIn);

server.post('/transactions', createTransaction);
server.get('/transactions', getUserTransactions);

// Testing part (delete after finishing project)

server.get('/sessions', async (req, res) => {
    const sessions = await db.collection('sessions').find({}).toArray();

    res.send(sessions);
});

server.get('/users', async (req, res) => {
    const users = await db.collection('users').find({}).toArray();

    res.send(users);
});

server.listen(5000, () => console.log("Listening to PORT 5000"));