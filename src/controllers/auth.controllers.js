import Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { stripHtml } from "string-strip-html";
import bcrypt from 'bcrypt';
import db from '../database/db.js';
import { STATUS_CODE } from '../enums/statusCode.js';
import { COLLECTIONS } from '../enums/collections.js';

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

async function signUp (req, res) {
    const validation = signUpSchema.validate(req.body, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map(error => error.message);
        res.status(STATUS_CODE.BAD_REQUEST).send(errors);
        return;
    }

    const {email, password} = req.body;
    const name = stripHtml(req.body.name).result.trim();

    if (await checkParticipant(email)) {
        res.sendStatus(STATUS_CODE.CONFLICT);
        return;
    }

    try {
        await db.collection(COLLECTIONS.USERS).insertOne({
            name,
            email,
            password: bcrypt.hashSync(password, 10),
        });

        res.sendStatus(STATUS_CODE.CREATED);
    } catch (error) {
        res.status(STATUS_CODE.SERVER_ERROR).send(error.message);
    }

    return;
}

async function checkParticipant(email) {
    let response;
    
    try {
        const existingParticipant = await db.collection(COLLECTIONS.USERS).findOne({ email });

        if (existingParticipant !== null) {
            response = true;
        } else {
            response = false;
        }
    } catch (error) {
        console.log(error.message);
        response = error.message;
    }

    return response;
}

async function signIn (req, res) {
    const validation = signInSchema.validate(req.body, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map(error => error.message);
        res.status(STATUS_CODE.BAD_REQUEST).send(errors);
        return;
    }

    const {email, password} = req.body;

    try {

        const user = await db.collection(COLLECTIONS.USERS).findOne({ email });

        if (user && bcrypt.compareSync(password, user.password)) {
            const token = uuid();
    
            await db.collection(COLLECTIONS.SESSIONS).insertOne({
                userId: user._id,
                token,
            });
    
            res.send({ token, name: user.name });
        } else {
            res.sendStatus(STATUS_CODE.NOT_FOUND);
        }

        return;
        
    } catch (error) {
        res.status(STATUS_CODE.SERVER_ERROR).send(error.message);
        return;
    }
}

export { signUp, signIn };