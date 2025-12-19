const http = require('http');

const ADMIN_TOKEN = 'sbp_ec3a9f9383beb846826bf276a72b5a829eb387be';

function getSpaces() {
    return new Promise((resolve, reject) => {
        console.log('Fetching spaces from Supabase via Admin API...');
        
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api/admin/spaces',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': ADMIN_TOKEN
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const spaces = JSON.parse(responseBody);
                        resolve(spaces);
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                        resolve([]);
                    }
                } else {
                    console.error(`❌ Error fetching spaces:`, res.statusCode, responseBody);
                    resolve([]);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Network error:`, e);
            reject(e);
        });

        req.end();
    });
}

async function main() {
    const spaces = await getSpaces();
    
    const communaute = spaces.find(s => s.id === 'communaute');
    const salleFocus = spaces.find(s => s.id === 'salle-focus');

    if (communaute) {
        console.log('--- Communaute ---');
        console.log('Image:', communaute.image.substring(0, 50) + '...');
    } else {
        console.log('❌ Communaute not found');
    }

    if (salleFocus) {
        console.log('--- Salle Focus ---');
        console.log('Image:', salleFocus.image.substring(0, 50) + '...');
    } else {
        console.log('❌ Salle Focus not found');
    }
}

main();