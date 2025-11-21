const FormData = require('form-data');
const axios = require('axios');

const submissions = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000;
const CLEANUP_INTERVAL = 60 * 60 * 1000;

setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of submissions.entries()) {
        const recentSubmissions = timestamps.filter(time => now - time < RATE_WINDOW);
        if (recentSubmissions.length === 0) {
            submissions.delete(ip);
        } else {
            submissions.set(ip, recentSubmissions);
        }
    }
}, CLEANUP_INTERVAL);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        'unknown';

    const now = Date.now();
    const userSubmissions = submissions.get(ip) || [];
    const recentSubmissions = userSubmissions.filter(time => now - time < RATE_WINDOW);

    if (recentSubmissions.length >= RATE_LIMIT) {
        const oldestSubmission = Math.min(...recentSubmissions);
        const timeUntilReset = Math.ceil((oldestSubmission + RATE_WINDOW - now) / 1000 / 60);

        return res.status(429).json({
            success: false,
            error: `Rate limit exceeded. Please try again in ${timeUntilReset} minute(s).`,
            retryAfter: timeUntilReset
        });
    }

    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            console.error('Missing environment variables');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }

        const { title, authorLink, fileData, fileName, fileSize } = req.body;

        if (!title || !fileData || !fileName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, file, or filename'
            });
        }

        if (title.length > 200) {
            return res.status(400).json({
                success: false,
                error: 'Title is too long (max 200 characters)'
            });
        }

        const MAX_FILE_SIZE_MB = 50;
        if (parseFloat(fileSize) > MAX_FILE_SIZE_MB) {
            return res.status(400).json({
                success: false,
                error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`
            });
        }

        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);

        let caption = `📦 New Mod Submission\n\n`;
        caption += `📝 Title: ${title}\n`;
        if (authorLink && authorLink.trim()) {
            caption += `👤 Author: ${authorLink}\n`;
        }
        caption += `📁 File: ${fileName}`;
        if (fileSize) {
            caption += ` (${fileSize} MB)`;
        }
        caption += `\n⏰ ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC`;

        formData.append('caption', caption);

        let fileBuffer;
        try {
            fileBuffer = Buffer.from(fileData, 'base64');
        } catch (error) {
            console.error('Invalid base64 data:', error);
            return res.status(400).json({
                success: false,
                error: 'Invalid file data'
            });
        }

        formData.append('document', fileBuffer, fileName);

        const telegramResponse = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
            formData,
            {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 60000
            }
        );

        if (telegramResponse.data.ok) {
            recentSubmissions.push(now);
            submissions.set(ip, recentSubmissions);

            return res.status(200).json({
                success: true,
                message: 'Mod submitted successfully'
            });
        } else {
            console.error('Telegram API error:', telegramResponse.data);
            throw new Error('Telegram API returned an error');
        }

    } catch (error) {
        console.error('Error processing submission:', error.message);

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                error: 'Request timeout. Please try again.'
            });
        }

        if (error.response) {
            console.error('Telegram API error response:', error.response.data);
            return res.status(500).json({
                success: false,
                error: 'Failed to send to Telegram. Please try again later.'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'An error occurred while processing your submission'
        });
    }
}