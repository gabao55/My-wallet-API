import Joi from 'joi';
import { v4 as uuid } from 'uuid';
import { stripHtml } from "string-strip-html";
import bcrypt from 'bcrypt';
import db from '../database/db.js';

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
        res.status(500).send(error.message)
    }

    return;
}

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
        console.log(error.message);
        response = error.message;
    }

    return response;
}

async function signIn (req, res) {
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
        res.status(500).send(error.message);
        return;
    }
}

export { signUp, signIn };