const https = require('https');
const fs = require('fs');

const options = {
    hostname: 'api.supabase.com',
    path: '/v1/projects/qnbsefixwcudppkiljxq/api-keys',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer sbp_e00a62672bd2223b39b8b5f5dc83171487e04b46'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('keys.json', data);
        console.log('Keys saved to keys.json');
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
