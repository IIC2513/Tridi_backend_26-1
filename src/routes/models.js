const express = require('express');
const { Op } = require("sequelize");
const path = require('node:path');
const router = express.Router();

const { User } = require('../models');
const { File } = require('../models');
const { ModelTridi } = require('../models');
const { Comment } = require('../models');
const { uploadModelFile, removeModelFile } = require('../services/storageService');
const requireAuth = require('../helpers/middlawares/authMiddlaware');
const requireSeller = require('../helpers/middlawares/requireSeller');

const ALLOWED = new Set(['.glb', '.gltf']);
const rawModel = express.raw({
    type: ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'],
    limit: '50mb',
});

router.get('/', async (req, res) => {
    try {
        const models = await ModelTridi.findAll({
            where: { creatorId: { [Op.not]: null } },
            include: [
                { model: File, as: 'files' },
                { model: User, as: 'creator', attributes: ['id', 'username', 'image'] },
            ]
        });
        res.status(200).json({ data: models });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/created/:ownerId', async (req, res) => {
    try {
        const models = await ModelTridi.findAll({
            where: { creatorId: req.params.ownerId },
            include: [
                { model: File, as: 'files' },
                { model: User, as: 'creator', attributes: ['id', 'username', 'image'] },
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
                { model: File, as: 'files' },
                { model: User, as: 'creator', attributes: ['id', 'username', 'image'] },
            ]
        });
        if (!model) {
            return res.status(404).json({ error: '3D Model not found.' });
        }
        res.status(200).json({ data: model });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', requireAuth, requireSeller, async (req, res) => {
    try {
        const { name, description, price, tags } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: 'Name missing' });

        const model = await ModelTridi.create({
            name: name.trim(),
            description: description ?? null,
            price: Number(price) || 0,
            tags: Array.isArray(tags) ? tags : [],
            creatorId: req.user.id,
            date: new Date(),
        });

        return res.status(201).json({ data: model });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id/file', requireAuth, requireSeller, rawModel, async (req, res) => {
    const ext = path.extname(req.query.filename?.toString() || '').toLowerCase();

    if (!ALLOWED.has(ext)) {
        return res.status(400).json({ error: 'Format not supported' });
    }
    if (!req.body?.length) {
        return res.status(400).json({ error: 'Missing file' });
    }
    if (req.body.length > 50 * 1024 * 1024) {
        return res.status(400).json({ error: 'The file surpasses the size limit (50mb)' });
    }
    const model = await ModelTridi.findByPk(req.params.id);
    if (!model) {
        return res.status(404).json({ error: 'Model not fount' });
    }
    if (model.creatorId !== req.user.id)
        return res.status(403).json({ error: 'Unauthorized' });

    let stored;
    try {
        stored = await uploadModelFile({
            buffer: req.body,
            originalName: `model${ext}`,
            contentType: req.headers['content-type'],
            ownerId: req.user.id,
        });
        await File.create({
            modelId: model.id,
            route: stored.route,
            extension: stored.extension,
            size: stored.size,
        });

        const withFiles = await ModelTridi.findByPk(model.id, {
            include: [{ model: File, as: 'files' }],
        });
        return res.status(200).json({ data: withFiles });
    } catch (err) {
        if (stored?.key) await removeModelFile(stored.key).catch(() => {});
        console.error('Model file upload failed:', err);
        return res.status(500).json({ error: 'No se pudo subir el archivo' });
    }
});

router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const model = await ModelTridi.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: '3D Model not found.' });

        if ((model.creatorId !== req.user.id) && (req.user.role !== 'admin')) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { name, description, price, tags } = req.body;
        const updates = {};

        if (name !== undefined) {
            if (!String(name).trim()) return res.status(400).json({ error: 'Name cannot be empty.' });
            updates.name = String(name).trim();
        }
        if (description !== undefined) updates.description = description ?? null;
        if (price !== undefined) {
            const n = Number(price);
            if (isNaN(n) || n < 0) return res.status(422).json({ error: 'Price must be a non-negative number.' });
            updates.price = n;
        }
        if (tags !== undefined) {
            updates.tags = Array.isArray(tags) ? tags : [];
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }

        await model.update(updates);

        const updatedModel = await ModelTridi.findByPk(model.id);

        res.status(200).json({ data: updatedModel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/comments', async (req, res) => {
    try {
        const model = await ModelTridi.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: '3D Model not found.' });

        const comments = await Comment.findAll({
            where: { modelId: req.params.id },
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'image'] }
            ]
        });

        res.status(200).json({ data: comments });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const model = await ModelTridi.findByPk(req.params.id);
        if (!model) return res.status(404).json({ error: '3D Model not found.' });

        if ((model.creatorId !== req.user.id) && (req.user.role !== 'admin')) {
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