// esta docu es boilerplate de ejemplo!
/**
 * @swagger
 * /:
 *   post:
 *     summary: Authenticate a user and create a session
 *     description: Validates the provided credentials, strips the password from the returned user object, and creates a new session.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: hunter2
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The authenticated user (password omitted)
 *                 session:
 *                   type: object
 *                   description: The newly created session
 *       400:
 *         description: Invalid credentials or login error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: integer
 *                       example: 400
 *                     message:
 *                       type: string
 *                       example: Invalid email or password
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */


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
