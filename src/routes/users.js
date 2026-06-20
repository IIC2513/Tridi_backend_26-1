const express = require('express');
const router = express.Router();

const { User } = require('../models');
const { Stats } = require('../models');

const { validateImageUrl } = require('../services/validateImg');

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

router.put('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if ((Number(req.params.id) !== req.user.id) && (req.user.role !== 'admin')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!user) return res.status(404).json({ error: 'User not found.' });

        const { username, email, password, image, seller } = req.body;

        const updates = {};

        if (Number(req.params.id) == req.user.id) {
            if (username !== undefined) updates.username = username;
            if (email !== undefined) updates.email = email;
            if (password !== undefined) updates.password = password;
        }

        if (image !== undefined && image.trim() !== ''){
            const check = await validateImageUrl(image.trim());
            if (!check.valid) {
                return res.status(400).json({ error: `Invalid image: ${check.reason}` });
            }
            updates.image = image.trim();
        }
        if (seller !== undefined && req.user.role === 'admin') {
            updates.seller = seller;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }

        await user.update(updates);

        const updatedUser = await User.findByPk(user.id, {
            attributes: ['id', 'username', 'image', 'seller', 'role', 'email'],
            include: [
                {
                    model: Stats,
                    as: 'stats',
                    attributes: ['c_sales', 'c_purchases', 'reputation'],
                }
            ]
        });

        res.status(200).json({ data: updatedUser });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors?.[0]?.path;
            return res.status(409).json({ error: `${field} is already in use.` });
        }
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
