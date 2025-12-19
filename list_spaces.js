const fs = require('fs');
const path = require('path');

const contentPath = 'c:\\Users\\sandr\\Desktop\\ESS SITE V3\\public\\galerie\\content.json';

try {
    const data = fs.readFileSync(contentPath, 'utf8');
    const content = JSON.parse(data);

    if (content.spaces) {
        console.log("Spaces found:");
        content.spaces.forEach(space => {
            console.log(`ID: ${space.id}, Name: ${space.name}`);
        });
    } else {
        console.log("No spaces key found.");
    }
} catch (err) {
    console.error("Error reading or parsing file:", err);
}
