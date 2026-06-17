const express = require('express');
const { Op, literal } = require("sequelize");
const router = express.Router();
const middlawareHandleLoggin = require("../helpers/middlawares/authMiddlaware")

const { User } = require('../models');
const { File } = require('../models');
const { ModelTridi } = require('../models');

router.get('/', async (req, res) => {
    try {

        const models = await ModelTridi.findAll({
            where: {
                creatorId: {
                    [Op.not]: null
                }
            },
            include: [
                {
                    model: File,
                    as: 'files',
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'image'],
                },
            ]
        });

        res.status(200).json({ data: models });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const model = await ModelTridi.findByPk(req.params.id, {
            include: [
                {
                    model: File,
                    as: 'files',
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'image'],
                },
            ]
        });
        if (!model) return res.status(404).json({ error: '3D Model not found.' });

        res.status(200).json({ data: model});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
  });

router.delete('/:id', middlawareHandleLoggin, async (req, res) => {
    try {
        const model = await ModelTridi.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: '3D Model not found.' });

        if ((model.creatorId !== req.user.id) && (req.user.role !== 'admin')){
            return res.status(403).json({ error: 'Forbidden' });
        }

        await model.destroy();

        res.status(200).json({ success: 'Model successfully deleted.' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;