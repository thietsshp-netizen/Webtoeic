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
    console.log("Tổng kích thước HTML:", data.length);
    const matches = [...data.matchAll(/AF_initDataCallback\(\{key: '([^']+)'/g)];
    console.log("Các key tìm thấy:", matches.map(m => m[1]));
    
    // Kiểm tra xem chuỗi 'S02E' hoặc 'mp4' có xuất hiện trong HTML không
    const s02eIdx = data.indexOf("S02E");
    console.log("Vị trí xuất hiện S02E trong HTML:", s02eIdx);
    if (s02eIdx !== -1) {
      console.log("Đoạn text quanh S02E:");
      console.log(data.substring(s02eIdx - 100, s02eIdx + 200));
    }
  });
});
