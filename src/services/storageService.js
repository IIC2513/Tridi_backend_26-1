'use strict';
// el tío me ayudo
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const { getSupabase } = require('../config/supabase');

const BUCKET = process.env.SUPABASE_MODELS_BUCKET || 'models';
const MIME = { glb: 'model/gltf-binary', gltf: 'model/gltf+json' };

async function uploadModelFile({ buffer, originalName, contentType, ownerId }) {
    const ext = path.extname(originalName).toLowerCase(); 
    const key = `${ownerId}/${randomUUID()}${ext}`;
    const supabase = getSupabase();

    const resolvedType = MIME[ext.slice(1)] || contentType || 'application/octet-stream';

    const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
        contentType: resolvedType,
        upsert: false,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const url = supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;

    return {
        key,                    
        route: url,            
        extension: ext.slice(1), 
        size: buffer.length,     
    };
}

async function removeModelFile(key) {
    await getSupabase().storage.from(BUCKET).remove([key]);
}

function getPublicModelUrl(key) {
    return getSupabase().storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

async function getSignedModelUrl(key, expiresIn = 3600) {
    const { data, error } = await getSupabase()
        .storage.from(BUCKET).createSignedUrl(key, expiresIn);
    if (error) throw new Error(error.message);
    return data.signedUrl;
}

module.exports = { uploadModelFile, removeModelFile, getPublicModelUrl, getSignedModelUrl };