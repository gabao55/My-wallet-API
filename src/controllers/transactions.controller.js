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
    const validation = transactionSchema.validate(req.body, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map(error => error.message);
        res.status(422).send(errors);
        return;
    }
    
    const user = res.locals.user;

    try {

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
    const user = res.locals.user;
    try {
    
        const transactions = await db.collection('transactions').find({ userId: user._id }).toArray();
    
        res.send(transactions);
        
    } catch (error) {
        res.status(500).send(error.message);
    }

    return;
}

export { createTransaction, getUserTransactions };