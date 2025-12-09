#!/usr/bin/env node

/**
 * Upload static files to Cloudflare KV
 * Usage: node scripts/upload-static-files.js
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, '../public');
const KV_NAMESPACE_ID = 'c31ff2e799ca4438a1063d863f633574';

// MIME types mapping
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

function getMimeType(filename) {
    const ext = filename.substring(filename.lastIndexOf('.'));
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function uploadFile(filename, content, mimeType) {
    // Create a temporary file with metadata
    const metadata = JSON.stringify({ contentType: mimeType });
    const key = `static:${filename}`;

    console.log(`Uploading ${filename} (${mimeType})...`);

    try {
        // Write content to a temp file
        const tempFile = `/tmp/${filename}`;
        writeFileSync(tempFile, content);

        // Upload to KV using wrangler
        execSync(
            `npx wrangler kv:key put --namespace-id=${KV_NAMESPACE_ID} "${key}" --path="${tempFile}" --metadata='${metadata}'`,
            { stdio: 'inherit' }
        );

        console.log(`✓ Uploaded ${filename}`);
    } catch (error) {
        console.error(`✗ Failed to upload ${filename}:`, error.message);
    }
}

function main() {
    console.log('📦 Uploading static files to Cloudflare KV...\n');

    const files = readdirSync(PUBLIC_DIR);

    for (const file of files) {
        const filePath = join(PUBLIC_DIR, file);
        const content = readFileSync(filePath);
        const mimeType = getMimeType(file);

        uploadFile(file, content, mimeType);
    }

    console.log('\n✅ All files uploaded successfully!');
    console.log('\nNow deploy your worker: npm run deploy');
}

main();
