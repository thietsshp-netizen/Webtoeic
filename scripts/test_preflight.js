const https = require('https');

const url = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev/toeic_part1/ETS2023_03_01.mp3';

console.log('=== TEST OPTIONS PREFLIGHT FROM CLOUDFLARE R2 ===');

const req = https.request(url, {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'range'
  }
}, (res) => {
  console.log('OPTIONS Status Code:', res.statusCode);
  console.log('OPTIONS Response Headers:');
  console.log(JSON.stringify(res.headers, null, 2));
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
