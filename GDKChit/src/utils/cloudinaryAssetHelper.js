const cloudinaryAssets = require('./cloudinaryAssets.json');

// Normalize mapping so lookups work with forward slashes, backslashes, or basenames
const normalizedMap = {};
Object.entries(cloudinaryAssets).forEach(([key, url]) => {
  const normalizedKey = key.replace(/\\/g, '/');
  normalizedMap[normalizedKey] = url;
  const basename = normalizedKey.split('/').pop();
  if (basename) {
    normalizedMap[basename] = url;
  }
});

/**
 * Returns a React Native Image source object pointing to high-speed Cloudinary CDN,
 * falling back to a local require() source if not mapped or if offline.
 */
function getCloudinaryAsset(assetKey, fallbackSource = null) {
  if (!assetKey) return fallbackSource;
  const normalized = String(assetKey).replace(/\\/g, '/');
  const basename = normalized.split('/').pop();
  const cloudUrl = normalizedMap[normalized] || normalizedMap[basename];
  if (cloudUrl) {
    return { uri: cloudUrl };
  }
  return fallbackSource;
}

module.exports = {
  getCloudinaryAsset,
  cloudinaryAssetsMap: normalizedMap
};
