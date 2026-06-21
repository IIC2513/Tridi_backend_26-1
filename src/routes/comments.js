const express = require('express');
const router = express.Router();

const middlawareHandleLoggin = require("../helpers/middlawares/authMiddlaware")

const { Comment } = require('../models');
const { User } = require('../models');
const { ModelTridi } = require('../models');
const { where } = require('sequelize');

router.post('/', middlawareHandleLoggin, async (req, res) => {
    try {
        const { content, modelId } = req.body;

        if (!content){
            return res.status(400).json({ error: 'content is required'});
        }

        if (!modelId){
            return res.status(400).json({ error: 'Model id is required'});
        }

        const model = await ModelTridi.findByPk(modelId);
        if (!model) {
            return res.status(404).json({ error: '3D Model not found.' });
        }

        const comment = await Comment.create({
            content: content,
            userId: req.user.id,
            modelId: modelId
        });

        res.status(201).json({ data: comment });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id', middlawareHandleLoggin, async (req, res) => {
    try {

        if (!(req.body.content)){
            return res.status(400).json({error: 'content is required'});
        }

        const comment = await Comment.findByPk(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found.' });

        if (comment.userId !== req.user.id){
            return res.status(403).json({ error: 'Forbidden' });
        }

        await comment.update({
            content: req.body.content
        });

        res.status(200).json({ data: comment });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', middlawareHandleLoggin, async (req, res) => {
    try {
        const comment = await Comment.findByPk(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found.' });

        if ((comment.userId !== req.user.id) && (req.user.role !== 'admin')){
            return res.status(403).json({ error: 'Forbidden' });
        }

        await comment.destroy();

        res.status(200).json({ success: 'Comment successfully deleted.' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;