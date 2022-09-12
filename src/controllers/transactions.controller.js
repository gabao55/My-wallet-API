import Joi from 'joi';
import { ObjectId } from 'mongodb';
import db from '../database/db.js';
import { COLLECTIONS } from '../enums/collections.js';
import { STATUS_CODE } from '../enums/statusCode.js';

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
        res.status(STATUS_CODE.BAD_REQUEST).send(errors);
        return;
    }
    
    const user = res.locals.user;

    try {

        const { type, date, description, value } = req.body;

        await db.collection(COLLECTIONS.TRANSACTIONS).insertOne({
            userId: user._id,
            type,
            date,
            description,
            value,
        });

        res.sendStatus(STATUS_CODE.CREATED);

        return;

    } catch (error) {
        res.status(STATUS_CODE.SERVER_ERROR).send(error.message);
        return;
    }

}

async function getUserTransactions (req, res) {
    const user = res.locals.user;
    try {
    
        const transactions = await db.collection(COLLECTIONS.TRANSACTIONS).find({ userId: user._id }).toArray();
    
        res.send(transactions);
        
    } catch (error) {
        res.status(STATUS_CODE.SERVER_ERROR).send(error.message);
    }

    return;
}

async function deleteTransaction (req, res) {
    const _id = new ObjectId(req.headers._id);

    try {

        const transaction = await db.collection(COLLECTIONS.TRANSACTIONS).findOne({ _id });

        if (!transaction) {
            res.sendStatus(STATUS_CODE.NOT_FOUND);
            return;
        }
        
        await db.collection(COLLECTIONS.TRANSACTIONS).deleteOne({ _id });

        res.sendStatus(STATUS_CODE.OK);

    } catch (error) {
        res.status(STATUS_CODE.SERVER_ERROR).send(error.message);
    }

    return;
}

async function updateTransaction (req, res) {
    const _id = new ObjectId(req.body._id);
    const { description, value } = req.body;

    try {

        const transaction = await db.collection(COLLECTIONS.TRANSACTIONS).findOne({ _id });

        if (!transaction) {
            res.sendStatus(STATUS_CODE.NOT_FOUND);
            return;
        }
        
        await db.collection(COLLECTIONS.TRANSACTIONS).updateOne(
            { _id },
            { $set: { description, value } }
        );

        res.sendStatus(STATUS_CODE.OK);

    } catch (error) {
        res.status(STATUS_CODE.SERVER_ERROR).send(error.message);
    }

    return;
}

export { createTransaction, getUserTransactions, deleteTransaction, updateTransaction };