const express = require('express');
const router = express.Router();
const middlawareHandleAdmin = require("../helpers/middlawares/adminMiddlaware");
const { Request, User, sequelize } = require('../models');
const SELLER_TYPE = 1;
const NAME_TO_TYPE = { seller: SELLER_TYPE };
const TYPE_TO_NAME = { [SELLER_TYPE]: 'seller' };

const STATUS_FROM_API = {
    pending: 'pending',
    approved: 'accepted',
    accepted: 'accepted',
    rejected: 'rejected',
};

function toTypeCode(type) {
    if (typeof type === 'number') return type;
    if (type in NAME_TO_TYPE) return NAME_TO_TYPE[type];
    if (/^\d+$/.test(String(type))) return parseInt(type, 10);
    return null; // unknown / unsupported
}


function serialize(request) {
    const json = typeof request.toJSON === 'function' ? request.toJSON() : request;
    return { ...json, type: TYPE_TO_NAME[json.type] ?? json.type };
}

router.post('/', async (req, res) => {
    try {
        const { type, content } = req.body;
        if (!type) {
            return res.status(400).json({ error: 'type is required' });
        }

        const typeCode = toTypeCode(type);
        if (typeCode === null) {
            return res.status(400).json({ error: 'Unsupported request type' });
        }

        const existing = await Request.findOne({
            where: { userId: req.user.id, type: typeCode, status: 'pending' }
        });
        if (existing) {
            return res.status(409).json({ error: 'You already have a pending request of this type.' });
        }

        const request = await Request.create({
            type: typeCode,
            content: content,
            status: 'pending',
            userId: req.user.id
        });
        res.status(201).json({ data: serialize(request) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/my', async (req, res) => {
    try {
        const requests = await Request.findAll({
            where: { userId: req.user.id },
            attributes: ['id', 'type', 'content', 'status'],
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'image'] }
            ]
        });
        res.status(200).json({ data: requests.map(serialize) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', [middlawareHandleAdmin], async (req, res) => {
    try {
        const requests = await Request.findAll({
            attributes: ['id', 'type', 'content', 'status'],
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'image'] }
            ]
        });
        res.status(200).json({ data: requests.map(serialize) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/pending', middlawareHandleAdmin, async (req, res) => {
    try {
        const requests = await Request.findAll({
            where: { status: 'pending' },
            attributes: ['id', 'type', 'content', 'status'],
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'image'] }
            ]
        });
        res.status(200).json({ data: requests.map(serialize) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:requestId', middlawareHandleAdmin, async (req, res) => {
    const dbStatus = STATUS_FROM_API[req.body.status];
    if (!dbStatus) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const t = await sequelize.transaction();
    try {
        const request = await Request.findByPk(req.params.requestId, { transaction: t });
        if (!request) {
            await t.rollback();
            return res.status(404).json({ error: 'Request not found.' });
        }

        await request.update({ status: dbStatus }, { transaction: t });
        if (dbStatus === 'accepted' && request.type === SELLER_TYPE) {
            await User.update(
                { seller: true },
                { where: { id: request.userId }, transaction: t }
            );
        }

        await t.commit();
        res.status(200).json({ data: serialize(request) });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
