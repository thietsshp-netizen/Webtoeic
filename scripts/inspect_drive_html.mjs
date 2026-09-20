import https from 'https';

const url = `https://drive.google.com/drive/folders/1KEYNMHMgFaPJVMndeMs0cym7OQ9hi-fK`;

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf("AF_initDataCallback({key: 'ds:1'");
    if (idx !== -1) {
      console.log("Tìm thấy ds:1 tại vị trí:", idx);
      console.log(data.substring(idx, idx + 400));
    } else {
      console.log("Không thấy ds:1, tìm các key khác:");
      const keys = [...data.matchAll(/AF_initDataCallback\(\{key: '([^']+)'/g)].map(m => m[1]);
      console.log("Keys:", keys);
    }
  });
});
