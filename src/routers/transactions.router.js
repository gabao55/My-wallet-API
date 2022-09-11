import express from 'express';
import { createTransaction, getUserTransactions } from '../controllers/transactions.controller.js';

const router = express.Router();

router.post('/transactions', createTransaction);
router.get('/transactions', getUserTransactions);

export default router;