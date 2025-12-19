const http = require('http');
const fs = require('fs');
const path = require('path');

// Read test.txt for Salle Focus image
const testTxtPath = path.join(__dirname, 'test.txt');
let testImageBase64;

try {
    testImageBase64 = fs.readFileSync(testTxtPath, 'utf8').trim();
    console.log('Read test.txt successfully. Length:', testImageBase64.length);
} catch (e) {
    console.error('Error reading test.txt:', e);
    process.exit(1);
}

const ADMIN_TOKEN = 'sbp_ec3a9f9383beb846826bf276a72b5a829eb387be';

function updateSpace(id, image) {
    return new Promise((resolve, reject) => {
        console.log(`Updating space: ${id}...`);
        
        const data = JSON.stringify({ image });
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: `/api/admin/spaces/${id}`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': ADMIN_TOKEN,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ Success updating ${id}`);
                    resolve(responseBody);
                } else {
                    console.error(`❌ Error updating ${id}:`, res.statusCode, responseBody);
                    resolve(null); // Resolve but log error
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Network error updating ${id}:`, e);
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

async function main() {
    try {
        // Update Espace Coworking
        await updateSpace('communaute', '/galerie/coworking.jpg');

        // Update Salle Focus
        await updateSpace('salle-focus', testImageBase64);
    } catch (error) {
        console.error("Main execution error:", error);
    }
}

main();