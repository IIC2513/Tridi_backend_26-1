'use strict';
// me ayudo el tío a hacer esto!
const { randomUUID } = require('crypto');
const path = require('path');
const { getSupabase } = require('../config/supabase');
const BUCKET = process.env.SUPABASE_MODELS_BUCKET || 'models';

async function uploadModelFile({ buffer, originalName, contentType, ownerId }) {
  const ext = path.extname(originalName).toLowerCase();
  const key = `${ownerId}/${randomUUID()}${ext}`; // generar key por colisiones :v
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
    contentType: contentType || 'application/octet-stream', // si no hay content-type guardar como bytes
    upsert: false,
  });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return { key, format: ext.slice(1) };
}

async function removeModelFile(key) {
  await getSupabase().storage.from(BUCKET).remove([key]);
}

function getPublicModelUrl(key) {
  return getSupabase().storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

async function getSignedModelUrl(key, expiresIn = 3600) {
  const { data, error } = await getSupabase().storage.from(BUCKET).createSignedUrl(key, expiresIn);
  if (error) {
    throw new Error(error.message);
  }
  return data.signedUrl;
}

module.exports = { uploadModelFile, removeModelFile, getPublicModelUrl, getSignedModelUrl };