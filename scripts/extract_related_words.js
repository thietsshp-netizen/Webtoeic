const fs = require('fs');
const path = require('path');

const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/toeic_7000_master.json';
const outputPath = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/Json 7000 tu toeic/cacTuLienQuan.txt';

console.log('Reading file...');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const words = new Set();

console.log('Processing items...');

data.forEach(item => {
    // meanings[].synonyms
    // meanings[].antonyms
    if (item.meanings) {
        item.meanings.forEach(m => {
            if (m.synonyms) {
                m.synonyms.forEach(s => {
                    if (s.word) {
                        let w = s.word.replace(/\s*\(.*?\)\s*/g, '').trim();
                        if (w) words.add(w.toLowerCase());
                    }
                });
            }
            if (m.antonyms) {
                m.antonyms.forEach(a => {
                    if (a.word) {
                        let w = a.word.replace(/\s*\(.*?\)\s*/g, '').trim();
                        if (w) words.add(w.toLowerCase());
                    }
                });
            }
        });
    }

    // word_family
    if (item.word_family) {
        item.word_family.forEach(wf => {
            if (wf.word) {
                // Remove (adj), (v), etc.
                let w = wf.word.replace(/\s*\(.*?\)\s*/g, '').trim();
                if (w) words.add(w.toLowerCase());
            }
        });
    }

    // common_structures
    if (item.common_structures) {
        item.common_structures.forEach(cs => {
            if (cs.structure) {
                let w = cs.structure.replace(/\s*\(.*?\)\s*/g, '').trim();
                if (w) words.add(w.toLowerCase());
            }
        });
    }
});

// Convert to array, sort, and join
const sortedWords = Array.from(words).sort((a, b) => a.localeCompare(b));
fs.writeFileSync(outputPath, sortedWords.join('\n'), 'utf8');

console.log(`Extracted ${sortedWords.length} unique items to ${outputPath}`);
