import express from 'express';
import cors from 'cors';
import authRouter from './routers/auth.router.js';
import transactionsRouter from './routers/transactions.router.js';

const server = express();
server.use(express.json());
server.use(cors());

server.use(authRouter);
server.use(transactionsRouter);

server.listen(5000, () => console.log("Listening to PORT 5000"));