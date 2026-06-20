const express = require('express');
const router = express.Router();

const middlawareHandleAdmin = require("../helpers/middlawares/adminMiddlaware")

const { Request } = require('../models');
const { User } = require('../models');
const { where } = require('sequelize');

router.post('/', async (req, res) => {
    try {
        const { type, content } = req.body;

        if (!type){
            return res.status(400).json({ error: 'type is required'});
        }

        const request = await Request.create({
            type: type,
            content: content,
            status: 'pending',
            userId: req.user.id
        });

        res.status(201).json({ data: request });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/my', async (req, res) => {
    try {

        const requests = await Request.findAll({
            where: {
                userId: req.user.id
            },
            attributes: ['id', 'type', 'content', 'status'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'image'],
                }
            ]
        });

        res.status(200).json({ data: requests });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', [, middlawareHandleAdmin], async (req, res) => {
    try {
        const requests = await Request.findAll({
            attributes: ['id', 'type', 'content', 'status'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'image'],
                }
            ]
        });

        res.status(200).json({ data: requests });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/pending', middlawareHandleAdmin, async (req, res) => {
    try {
        const requests = await Request.findAll({
            where: {
                status: 'pending'
            },
            attributes: ['id', 'type', 'content', 'status'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'image'],
                }
            ]
        });

        res.status(200).json({ data: requests });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:requestId', middlawareHandleAdmin, async (req, res) => {
    try {

        const validStatus = ['pending', 'approved', 'rejected'];

        if (!validStatus.includes(req.body.status)){
            return res.status(400).json({error: 'Invalid status'});
        }

        const request = await Request.findByPk(req.params.requestId);
        if (!request) return res.status(404).json({ error: 'Request not found.' });

        await request.update({
            status: req.body.status
        });

        res.status(200).json({ data: request });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
