const { login } = require('../helpers/loginStrategy');
const { createSession } = require('../helpers/createSessionHelper');

const express = require('express');

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
    try {
        const [user, error] = await login(req.body);

        if (error)
            return res.status(error.status).json({ error });

        delete user.dataValues.password;

        const session = await createSession(user);

        return res.status(200).json({ user, session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
