const fs = require('fs');
const readline = require('readline');

const contentPath = 'c:\\Users\\sandr\\Desktop\\ESS SITE V3\\public\\galerie\\content.json';
const outputPath = 'c:\\Users\\sandr\\Desktop\\ESS SITE V3\\spaces_list.txt';

const fileStream = fs.createReadStream(contentPath);
const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
});

let output = '';

rl.on('line', (line) => {
    if (line.includes('"id":') || line.includes('"name":')) {
        output += line.trim() + '\n';
    }
});

rl.on('close', () => {
    fs.writeFileSync(outputPath, output);
    console.log('Done.');
});
