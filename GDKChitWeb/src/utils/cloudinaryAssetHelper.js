import cloudinaryAssets from './cloudinaryAssets.json';

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
 * Returns a high-speed Cloudinary CDN URL, falling back to local source
 */
export function getCloudinaryAsset(assetKey, fallbackUrl = '') {
  if (!assetKey) return fallbackUrl;
  const normalized = String(assetKey).replace(/\\/g, '/');
  const basename = normalized.split('/').pop();
  return normalizedMap[normalized] || normalizedMap[basename] || fallbackUrl;
}

export default normalizedMap;
