const https = require('https');

const r2Base = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev';

const samplePaths = [
  'toeic_part1/ETS2022_04_05.mp3',
  'toeic_part1/ETS2022_04_05.webp',
  'toeic_part1/ETS2023_04_04.mp3',
  'toeic_part1/ETS2023_04_04.webp',
  'toeic_part1/ETS2026_03_01.mp3',
  'toeic_part1/ETS2026_03_01.webp',
  'toeic_part1/ETS2026_08_06.mp3',
  'toeic_part1/ETS2026_08_06.webp'
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
  console.log('=== THỬ NGHIỆM LINK CLOUDFLARE R2 PART 1 ===');
  for (const p of samplePaths) {
    const res = await checkUrl(p);
    console.log(`[${res.statusCode}] ${res.url}`);
  }
}

main();
