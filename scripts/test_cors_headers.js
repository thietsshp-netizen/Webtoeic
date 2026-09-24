const https = require('https');

const url = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev/toeic_part1/ETS2020_01_04.mp3';

console.log('=== TEST CORS RESPONSE HEADERS FROM CLOUDFLARE R2 ===');

const req = https.request(url, {
  method: 'GET',
  headers: {
    'Origin': 'http://localhost:3000'
  }
}, (res) => {
  console.log('HTTP Status Code:', res.statusCode);
  console.log('Response Headers:');
  console.log(JSON.stringify(res.headers, null, 2));
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
