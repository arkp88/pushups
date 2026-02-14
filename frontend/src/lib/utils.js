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
 * Routes HTTP URLs through a HTTPS proxy to avoid mixed content blocking
 *
 * @param {string} url - The image URL
 * @returns {string|null} - Safe URL or null if invalid
 */
export function getSafeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // If URL is already HTTPS or relative, return as-is
  if (trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }

  // If HTTP URL, route through HTTPS image proxy
  // Using images.weserv.nl - a free, open-source image proxy service
  if (trimmed.startsWith('http://')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(trimmed)}`;
  }

  // Non-URL strings (garbage data, placeholders) — treat as no image
  return null;
}

/**
 * Converts simple markdown formatting to HTML
 * Handles **bold**, *italic*, and _italic_ syntax
 * Also preserves safe HTML tags like <br>, <hr>, <p>
 *
 * @param {string} text - The markdown text to convert
 * @returns {string} - HTML string with formatting
 */
export function convertMarkdownToHTML(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Convert **bold** to <strong>bold</strong>
  text = text.replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>');

  // Convert *italic* to <em>italic</em> (but not if part of **)
  // This regex avoids matching ** by using negative lookahead/lookbehind
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/gs, '<em>$1</em>');

  // Convert _italic_ to <em>italic</em>
  text = text.replace(/_(.+?)_/gs, '<em>$1</em>');

  // Note: <br>, <hr>, <p> tags already in the text will be preserved
  // since we use dangerouslySetInnerHTML which renders raw HTML

  return text;
}
