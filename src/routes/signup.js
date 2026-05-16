const { signUp } = require('../helpers/signUpStrategy');
const { createSession } = require('../helpers/createSessionHelper');

const express = require('express');

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
    try {
        const [user, created, error] = await signUp(req.body);

        if (error)
            return res.status(error.status).json({ error });

        delete user.dataValues.password;

        if (!created)
            return res.status(200).json({ user });

        const session = await createSession(user);

        return res.status(201).json({ user, session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
