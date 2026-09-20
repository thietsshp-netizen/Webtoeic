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
    const s02eIdx = data.indexOf("S02E01.The.One.with");
    console.log(data.substring(s02eIdx - 200, s02eIdx + 800));
  });
});
