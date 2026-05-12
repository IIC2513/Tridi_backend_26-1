const express = require('express');
const { Op, literal } = require("sequelize");
const router = express.Router();

const { ModelTridi } = require('../models');

router.get('/', async (req, res) => {
    try {

        const models = await ModelTridi.findAll({
            where: {
                creatorId: {
                    [Op.not]: null
                }
        }});

        res.status(200).json({ data: models });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
