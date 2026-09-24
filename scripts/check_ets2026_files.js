const https = require('https');

const r2Base = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev';

const testFiles = [
  'toeic_part1/ETS2026_01_01.mp3',
  'toeic_part1/ETS2026_01_02.mp3',
  'toeic_part1/ETS2026_01_03.mp3',
  'toeic_part1/ETS2026_01_04.mp3',
  'toeic_part1/ETS2026_01_05.mp3',
  'toeic_part1/ETS2026_01_06.mp3'
];

async function checkUrl(pathStr) {
  const url = `${r2Base}/${pathStr}`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ pathStr, url, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ pathStr, url, statusCode: err.message });
    });
  });
}

async function main() {
  console.log('=== KIỂM TRA TẤT CẢ FILE AUDIO ETS2026 TEST 1 TRÊN R2 ===');
  for (const p of testFiles) {
    const res = await checkUrl(p);
    console.log(`[Status: ${res.statusCode}] ${res.url}`);
  }
}

main();
