const { Session } = require('../models');
const { signUp, createSessionToken } = require('../helpers/signUpFactory');

const dayjs = require('dayjs');
const express = require('express');

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
    try {
        const [user, created, error] = await signUp(req.body);

        if (error)
            return res.status(error.status).json({error: error});

        if (!created)
            return res.status(200).json({ user });

        delete user.dataValues.password;

        const session = await Session.create({
            userId: user.id,
            token: createSessionToken(user.id),
            exp_date: dayjs().add(1, 'hour').toDate()
        });

        return res.status(201).json({ user, session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
