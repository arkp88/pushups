/**
 * Utility functions for the quiz app
 */

/**
 * Upgrades HTTP URLs to HTTPS to prevent mixed content issues
 * when the app is hosted on HTTPS (Vercel default)
 *
 * @param {string} url - The image URL to check
 * @returns {string} - HTTPS version of the URL, or original if already HTTPS/relative
 */
export function ensureHttps(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // If URL starts with http:// (not https://), upgrade to https://
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  // Already HTTPS or relative URL - return as-is
  return url;
}

/**
 * Validates if an image URL is likely to load in a mixed content context
 *
 * @param {string} url - The image URL to validate
 * @returns {boolean} - true if URL should load, false if it might be blocked
 */
export function isSecureImageUrl(url) {
  if (!url) return true; // No URL means no image, which is valid

  // Check if we're on HTTPS
  const isHttpsPage = window.location.protocol === 'https:';

  // If page is HTTPS and image is HTTP, it will be blocked
  if (isHttpsPage && url.startsWith('http://')) {
    return false;
  }

  return true;
}

/**
 * Gets a safe image URL that won't cause mixed content errors
 * If the URL would be blocked, returns null so caller can show a placeholder
 *
 * @param {string} url - The image URL
 * @returns {string|null} - Safe URL or null if unsafe
 */
export function getSafeImageUrl(url) {
  if (!url) return null;

  // Try to upgrade HTTP to HTTPS
  const httpsUrl = ensureHttps(url);

  // Return the upgraded URL
  // Note: This might still fail to load if the server doesn't support HTTPS,
  // but that's better than getting blocked by mixed content policy
  return httpsUrl;
}
