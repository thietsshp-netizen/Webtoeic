const fs = require('fs');
const path = require('path');

const dir = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic';
const file1 = path.join(dir, 'cacTuLienQuan.txt');
const file2 = path.join(dir, 'cacTuTrongMucWord.txt');
const outputFile = path.join(dir, 'CacTuConThieu.txt');

console.log('Loading File 2 (main words)...');
const file2Content = fs.readFileSync(file2, 'utf8');
const mainWordsLines = file2Content.split('\n');
const mainWordsSet = new Set(mainWordsLines.map(w => w.trim().toLowerCase()).filter(w => w.length > 0));

console.log('Loading File 1 (related items)...');
const file1Content = fs.readFileSync(file1, 'utf8');
const relatedItemsLines = file1Content.split('\n');

console.log('Finding missing items...');
const missingItems = [];
relatedItemsLines.forEach(line => {
    const item = line.trim();
    if (item.length > 0) {
        if (!mainWordsSet.has(item.toLowerCase())) {
            missingItems.push(item);
        }
    }
});

fs.writeFileSync(outputFile, missingItems.join('\n'), 'utf8');
console.log(`Found ${missingItems.length} missing items. Saved to ${outputFile}`);
