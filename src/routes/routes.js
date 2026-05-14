const express = require('express');

const authRouter = require('./auth');
const usersRouter = require('./users');
const modelsRouter = require('./models');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/models', modelsRouter);

module.exports = router;