const fs = require('fs');
const path = require('path');

const dir = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic';
const file1 = path.join(dir, 'CacTuConThieu.txt');
const file2 = path.join(dir, 'cacTuTrongMucWord.txt');
const outputFile = path.join(dir, 'CaTuDonConThieu.txt');

console.log('Loading File 2 (main words)...');
const mainWordsContent = fs.readFileSync(file2, 'utf8');
const mainWordsSet = new Set(mainWordsContent.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0));

console.log('Loading File 1 (missing candidates)...');
const missingContent = fs.readFileSync(file1, 'utf8');
const missingWords = missingContent.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

console.log('Finding unique missing single words...');
const finalMissing = missingWords.filter(w => !mainWordsSet.has(w));

console.log('Sorting and saving...');
const sortedFinal = Array.from(new Set(finalMissing)).sort((a, b) => a.localeCompare(b));
fs.writeFileSync(outputFile, sortedFinal.join('\n'), 'utf8');

console.log(`Found ${sortedFinal.length} missing single words. Saved to ${outputFile}`);
