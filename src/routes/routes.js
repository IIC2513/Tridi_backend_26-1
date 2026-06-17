const express = require('express');
const path = require('path');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const usersRouter = require('./users');
const cartRouter = require('./cart');
const modelsRouter = require('./models');
const loginRouter = require('./login');
const signupRouter = require('./signup');
const purchasesRouter = require('./purchase');
const cardRouter = require('./card');

const middlawareHandleLoggin = require("../helpers/middlawares/authMiddlaware")
const middlawareHandleAdmin = require("../helpers/middlawares/adminMiddlaware")
const router = express.Router();

router.use('/users', middlawareHandleLoggin, usersRouter);
router.use('/models', modelsRouter);
router.use('/login', loginRouter);
router.use('/signup', signupRouter);
router.use('/cart', middlawareHandleLoggin, cartRouter);
router.use('/purchases', middlawareHandleLoggin, purchasesRouter);
router.use('/cards', cardRouter);

const swaggerPath = path.join(__dirname, '../openapi.yaml');
const swaggerDocument = YAML.load(swaggerPath);
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument));

module.exports = router;
