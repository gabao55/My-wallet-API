import db from '../database/db.js';

async function userAuthentication (req, res, next) {
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
        res.sendStatus(401);
        return;
    }

    const session = await db.collection('sessions').findOne({ token });

    if (!session) {
        return res.sendStatus(401);
    }
    const user = await db.collection('users').findOne({ _id: session.userId });

    if (!user) {
        res.sendStatus(401);
        return;
    }

    res.locals.user = user;

    next();

    return;
}

export default userAuthentication;