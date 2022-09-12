import express from 'express';
import { createTransaction, deleteTransaction, getUserTransactions, updateTransaction } from '../controllers/transactions.controller.js';
import userAuthentication from '../middlewares/authentication.middleware.js';

const router = express.Router();

router.use(userAuthentication);

const path = '/transactions';

router.post(path, createTransaction);
router.get(path, getUserTransactions);
router.delete(path, deleteTransaction);
router.put(path, updateTransaction);

export default router;