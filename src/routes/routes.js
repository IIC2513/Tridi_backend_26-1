const express = require('express');

const usersRouter = require('./users');

const modelsRouter = require('./models');
const loginRouter = require('./login');
const signupRouter = require('./signup');

const router = express.Router();

router.use('/users', usersRouter);
router.use('/models', modelsRouter);
router.use('/login', loginRouter);
router.use('/signup', signupRouter);

module.exports = router;