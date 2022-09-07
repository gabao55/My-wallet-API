import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import Joi from 'joi';
import { v4 as uuid } from 'uuid';
dotenv.config();

const server = express();

server.use(express.json());
express.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
const dbName = 'my-wallet';
mongoClient.connect().then(() => db = MongoClient.db(dbName));

const userSchema = Joi.object({
    _id: Joi.ObjectId(),
    name: Joi.string().required().min(1),
    email: Joi.email().required(),
    password: Joi.password().required().min(8),
    passwordConfirmation: Joi.password().required().valid(Joi.ref('password'))
});

const extractSchema = Joi.object({
    _id: Joi.ObjectId(),
    usedId: Joi.ObjectId(),
    date: Joi.date().required(),
    description: Joi.string().required().min(1),
    value: Joi.number().required().min(0)
});

const sessionSchema = Joi.object({
    _id: Joi.ObjectId(),
    userId: Joi.ObjectId(),
    token: Joi.token().required()
});

server.listen(5000, () => console.log("Listening to PORT 5000"));