const fs = require('fs');
const path = require('path');

const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/CacTuConThieu.txt';

console.log('Reading file...');
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const wordSet = new Set();

console.log('Splitting phrases into words...');
lines.forEach(line => {
    // Extract words: sequences of alphanumeric characters, including internal hyphens and apostrophes
    const matches = line.match(/[a-zA-Z0-9]+(?:[-'][a-zA-Z0-9]+)*/g);
    if (matches) {
        matches.forEach(w => {
            let word = w.toLowerCase().trim();
            if (word.length > 0) {
                wordSet.add(word);
            }
        });
    }
});

const sortedWords = Array.from(wordSet).sort((a, b) => a.localeCompare(b));
fs.writeFileSync(filePath, sortedWords.join('\n'), 'utf8');

console.log(`Processed into ${sortedWords.length} unique single words.`);
