const express = require('express');

const usersRouter = require('./users');
const modelsRouter = require('./modelstridi');

const router = express.Router();

router.use('/users', usersRouter);
router.use('/models', modelsRouter);

module.exports = router;