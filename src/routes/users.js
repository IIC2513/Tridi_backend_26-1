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

module.exports = router;