import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { stripHtml } from "string-strip-html";
import bcrypt from 'bcrypt';
dotenv.config();

const server = express();

server.use(express.json());
server.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
const dbName = 'my-wallet';
mongoClient.connect().then(() => db = mongoClient.db(dbName));

const signUpSchema = Joi.object({
    _id: Joi.string().hex().length(24),
    name: Joi.string().required().min(1),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    passwordConfirmation: Joi.string().required().valid(Joi.ref('password'))
});

const signInSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required().min(1),
});

const transactionSchema = Joi.object({
    _id: Joi.string().hex().length(24),
    usedId: Joi.string().hex().length(24),
    type: Joi.string().valid("expense", "income").required(),
    date: Joi.date().required(),
    description: Joi.string().required().min(1),
    value: Joi.number().required().min(0)
});

server.post('/sign-up', async (req, res) => {
    const validation = signUpSchema.validate(req.body, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map(error => error.message);
        res.status(422).send(errors);
        return;
    }

    const {email, password} = req.body;
    const name = stripHtml(req.body.name).result.trim();

    if (await checkParticipant(email)) {
        res.sendStatus(409);
        return;
    }

    try {
        await db.collection("users").insertOne({
            name,
            email,
            password: bcrypt.hashSync(password, 10),
        });

        res.sendStatus(201);
    } catch (error) {
        res.status(500).send(error)
    }

    return;
});

async function checkParticipant(email) {
    let response;
    
    try {
        const existingParticipant = await db.collection("users").findOne({ email });

        if (existingParticipant !== null) {
            response = true;
        } else {
            response = false;
        }
    } catch (error) {
        console.log(error);
        response = error;
    }

    return response;
}

server.post('/sign-in', async (req, res) => {
    const validation = signInSchema.validate(req.body, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map(error => error.message);
        res.status(422).send(errors);
        return;
    }

    const {email, password} = req.body;

    try {

        const user = await db.collection('users').findOne({ email });

        if (user && bcrypt.compareSync(password, user.password)) {
            const token = uuid();
    
            await db.collection('sessions').insertOne({
                userId: user._id,
                token,
            });
    
            res.send(token);
        } else {
            res.sendStatus(404);
        }

        return;
        
    } catch (error) {
        res.status(500).send(error);
        return;
    }
});

server.post('/transactions', async (req, res) => {
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
        res.status(500).send(error);
        return;
    }

});

server.get('/transactions', async (req, res) => {
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
        res.status(500).send(error);
    }

    return;
});

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