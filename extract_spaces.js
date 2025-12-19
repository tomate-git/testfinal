const fs = require('fs');
const contentPath = 'c:\\Users\\sandr\\Desktop\\ESS SITE V3\\public\\galerie\\content.json';
const outputPath = 'c:\\Users\\sandr\\Desktop\\ESS SITE V3\\spaces_list.txt';

const stream = fs.createReadStream(contentPath, { encoding: 'utf8' });
let buffer = '';

stream.on('data', (chunk) => {
    buffer += chunk;
    // Process buffer to find "name": "..."
    // This is a simple heuristic, assuming "name" key is not split across chunks in a weird way that breaks regex too badly
    // But for a robust solution we should parse JSON.
    // Given the file size, let's try to parse it if we can accumulate it, but if it fails, we fail.
    // Actually, 6MB is small for Node.js. The previous failure might be due to console output buffer limits or something else.
});

stream.on('end', () => {
    try {
        const content = JSON.parse(buffer);
        let output = '';
        if (content.spaces) {
            content.spaces.forEach(space => {
                output += `ID: ${space.id}, Name: ${space.name}\n`;
            });
        }
        fs.writeFileSync(outputPath, output);
        console.log("Done writing to file.");
    } catch (err) {
        fs.writeFileSync(outputPath, "Error: " + err.message);
        console.log("Error parsing JSON.");
    }
});
