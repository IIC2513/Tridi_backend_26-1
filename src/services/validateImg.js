const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function validateImageUrl(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return { valid: false, reason: 'Invalid URL.' };
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, reason: 'Protocol not allowed.' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        let response = await fetch(url, { method: 'HEAD', signal: controller.signal });

        if (!response.ok || !response.headers.get('content-type')) {
            response = await fetch(url, { method: 'GET', signal: controller.signal });
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
            return { valid: false, reason: `The URL responded with a status code ${response.status}.` };
        }

        const contentType = response.headers.get('content-type')?.split(';')[0].trim();

        if (!contentType || !ALLOWED_IMAGE_TYPES.includes(contentType)) {
            return { valid: false, reason: `Prohibited content types: ${contentType}` };
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
            return { valid: false, reason: 'The image exceeds the maximum allowed size.' };
        }

        return { valid: true };

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            return { valid: false, reason: 'It took too long to verify the image.' };
        }
        return { valid: false, reason: 'The URL could not be accessed.' };
    }
}

module.exports = { validateImageUrl };