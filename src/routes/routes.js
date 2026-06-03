const express = require('express');

const usersRouter = require('./users');
const cartRouter = require('./cart');
const modelsRouter = require('./models');
const loginRouter = require('./login');
const signupRouter = require('./signup');
const purchasesRouter = require('./purchase');

const middlawareHandleLoggin = require("../helpers/middlawares/authMiddlaware")
const router = express.Router();

router.use('/users', middlawareHandleLoggin, usersRouter);
router.use('/models', modelsRouter);
router.use('/login', loginRouter);
router.use('/signup', signupRouter);
router.use('/cart', middlawareHandleLoggin, cartRouter);
router.use('/purchases', middlawareHandleLoggin, purchasesRouter);

module.exports = router;
