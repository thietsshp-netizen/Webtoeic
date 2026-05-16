const fs = require('fs');
const path = require('path');

const dir = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic';
const missingFile = path.join(dir, 'CacTuConThieu.txt');
const mainWordsFile = path.join(dir, 'cacTuTrongMucWord.txt');

console.log('Loading main words list...');
const mainWordsContent = fs.readFileSync(mainWordsFile, 'utf8');
const mainWordsSet = new Set(mainWordsContent.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0));

console.log('Loading current missing words...');
const missingContent = fs.readFileSync(missingFile, 'utf8');
const missingWords = missingContent.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

console.log('Filtering out main words...');
const finalMissing = missingWords.filter(w => !mainWordsSet.has(w));

console.log('Sorting and saving...');
const sortedFinal = finalMissing.sort((a, b) => a.localeCompare(b));
fs.writeFileSync(missingFile, sortedFinal.join('\n'), 'utf8');

console.log(`Final missing words count: ${sortedFinal.length}`);
