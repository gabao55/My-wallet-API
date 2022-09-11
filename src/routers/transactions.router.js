import express from 'express';
import { createTransaction, deleteTransaction, getUserTransactions } from '../controllers/transactions.controller.js';
import userAuthentication from '../middlewares/authentication.middleware.js';

const router = express.Router();

router.use(userAuthentication);

router.post('/transactions', createTransaction);
router.get('/transactions', getUserTransactions);
router.delete('/transactions', deleteTransaction);

export default router;