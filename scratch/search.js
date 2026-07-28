const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const lines = content.split('\n');
const results = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('feed-') || lines[i].includes('feedApp')) {
        results.push((i + 1) + ': ' + lines[i].trim());
    }
}
fs.writeFileSync(path.join(__dirname, 'results.txt'), results.join('\n'));
