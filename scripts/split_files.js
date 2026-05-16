const fs = require('fs');
const path = require('path');

const inputFilePath = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Ca tu don con thieu/CaTuDonConThieu.txt';
const outputDir = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Ca tu don con thieu/';

console.log('Reading file...');
if (!fs.existsSync(inputFilePath)) {
    console.error('File not found:', inputFilePath);
    process.exit(1);
}

const content = fs.readFileSync(inputFilePath, 'utf8');
const words = content.split('\n').map(w => w.trim()).filter(w => w.length > 0);

const batchSize = 30;
const totalBatches = Math.ceil(words.length / batchSize);

console.log(`Splitting ${words.length} words into ${totalBatches} batches...`);

for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = start + batchSize;
    const batch = words.slice(start, end);
    const outputFileName = `lan${i + 1}.txt`;
    const outputPath = path.join(outputDir, outputFileName);
    fs.writeFileSync(outputPath, batch.join('\n'), 'utf8');
}

console.log('Splitting complete.');
