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

const userSchema = Joi.object({
    _id: Joi.string().hex().length(24),
    name: Joi.string().required().min(1),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8),
    passwordConfirmation: Joi.string().required().valid(Joi.ref('password'))
});

const extractSchema = Joi.object({
    _id: Joi.string().hex().length(24),
    usedId: Joi.string().hex().length(24),
    date: Joi.date().required(),
    description: Joi.string().required().min(1),
    value: Joi.number().required().min(0)
});

const sessionSchema = Joi.object({
    _id: Joi.string().hex().length(24),
    userId: Joi.string().hex().length(24),
    token: Joi.string().required()
});

server.post('/sign-up', async (req, res) => {
    const validation = userSchema.validate(req.body, { abortEarly: false });
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
        console.log(error);
        res.status(500).send(error)
    }

    return;
});

async function checkParticipant(email) {
    let response;
    
    try {
        const existingParticipant = await db.collection("users").findOne({email});

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

server.get('/users', async (req, res) => {
    const users = await db.collection('users').find({}).toArray();

    res.send(users);
});

server.listen(5000, () => console.log("Listening to PORT 5000"));