const fs = require('fs');
const path = require('path');

const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json';
const outputPath = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/cacTuTrongMucWord.txt';

console.log('Reading file...');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const words = [];

console.log('Extracting "word" fields...');

data.forEach(item => {
    if (item.word) {
        words.push(item.word.trim());
    }
});

fs.writeFileSync(outputPath, words.join('\n'), 'utf8');

console.log(`Extracted ${words.length} words to ${outputPath}`);
