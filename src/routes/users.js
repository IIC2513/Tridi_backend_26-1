const express = require('express');
const router = express.Router();

const { User } = require('../models');
const { Stats } = require('../models');

router.get('/', async (req, res) => {
    try {

        const users = await User.findAll({
            attributes: ['id', 'username', 'image', 'seller', 'role'],
            include: [
                {
                    model: Stats,
                    as: 'stats',
                    attributes: ['c_sales', 'c_purchases', 'reputation'],
                }
            ]
        });

        res.status(200).json({ data: users });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                username: req.params.username
            },
            attributes: ['id', 'username', 'image', 'seller', 'role'],
            include: [
                {
                    model: Stats,
                    as: 'stats',
                    attributes: ['c_sales', 'c_purchases', 'reputation'],
                }
            ]
        });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        res.status(200).json({ data: user });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        if ((Number(req.params.id) !== req.user.id) && (req.user.role !== 'admin')){
            return res.status(403).json({ error: 'Forbidden' });
        }

        await user.destroy();

        res.status(200).json({ success: 'User successfully deleted.' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;