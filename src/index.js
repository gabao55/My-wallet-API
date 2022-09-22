import express from 'express';
import cors from 'cors';
import authRouter from './routers/auth.router.js';
import transactionsRouter from './routers/transactions.router.js';

const server = express();
server.use(express.json());
server.use(cors());

server.use(authRouter);
server.use(transactionsRouter);

server.listen(process.env.PORT, () => console.log(`Listening to PORT ${process.env.PORT}`));