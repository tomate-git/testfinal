const fs = require('fs');
const path = require('path');

const contentPath = path.join(__dirname, '../front end data/content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

const imageMapping = {
    'communaute': '/galerie/espace_communautaire_1.jpg',
    'kiosque': '/galerie/kiosque.jpg',
    'container': '/galerie/container_pro.jpg',
    'coworking': '/galerie/coworking.jpg'
};

content.spaces = content.spaces.map(space => {
    if (imageMapping[space.id]) {
        space.image = imageMapping[space.id];
    }
    return space;
});

fs.writeFileSync(contentPath, JSON.stringify(content, null, 2));
console.log('Updated content.json with new image paths');
