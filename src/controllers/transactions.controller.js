import Joi from 'joi';
import db from '../database/db.js';

const transactionSchema = Joi.object({
    _id: Joi.string().hex().length(24),
    usedId: Joi.string().hex().length(24),
    type: Joi.string().valid("expense", "income").required(),
    date: Joi.date().required(),
    description: Joi.string().required().min(1),
    value: Joi.number().required().min(0)
});

async function createTransaction (req, res) {
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
        res.sendStatus(401);
        return;
    }

    const validation = transactionSchema.validate(req.body, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map(error => error.message);
        res.status(422).send(errors);
        return;
    }

    try {
        
        const session = await db.collection('sessions').findOne({ token });

        if (!session) {
            return res.sendStatus(401);
        }
        const user = await db.collection('users').findOne({ _id: session.userId });

        if (!user) {
            res.sendStatus(401);
            return;
        }

        const { type, date, description, value } = req.body;

        await db.collection('transactions').insertOne({
            userId: user._id,
            type,
            date,
            description,
            value,
        });

        res.sendStatus(201);

        return;

    } catch (error) {
        res.status(500).send(error.message);
        return;
    }

}

async function getUserTransactions (req, res) {
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
        res.sendStatus(401);
        return;
    }

    try {

        const session = await db.collection('sessions').findOne({ token });
    
        if (!session) {
            res.sendStatus(401);
            return;
        }
    
        const transactions = await db.collection('transactions').find({ userId: session.userId }).toArray();
    
        res.send(transactions);
        
    } catch (error) {
        res.status(500).send(error.message);
    }

    return;
}

export { createTransaction, getUserTransactions };