const https = require('https');

const r2Base = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev';

const testFiles = [
  'toeic_part1/ETS2022_03_01.mp3', // File chạy thành công (200 OK)
  'toeic_part1/ETS2023_03_01.mp3', // File báo lỗi CORS trên màn hình của bạn
  'toeic_part1/ETS2022_04_01.mp3'  // File báo lỗi CORS trên màn hình của bạn
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
  console.log('=== TRUY VẤN XÁC MINH CÁC FILE TRÊN R2 ===');
  for (const p of testFiles) {
    const res = await checkUrl(p);
    console.log(`[Status: ${res.statusCode}] ${res.url}`);
  }
}

main();
