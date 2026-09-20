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
    // Regex tìm data-id="..." kết hợp với tên file mp4 trong data-tooltip hoặc aria-label
    // Ví dụ: data-id="([^"]+)"[^\>]*data-tooltip="([^"]+\.mp4)
    // Hoặc tìm tất cả các thẻ có data-id và tìm tên file bên trong
    const regex = /data-id="([a-zA-Z0-9_-]+)"[^>]*data-tooltip="([^"]+)"/g;
    let match;
    const mp4Files = [];
    while ((match = regex.exec(data)) !== null) {
      const fileId = match[1];
      const filename = match[2];
      if (filename.includes('.mp4') || filename.includes('Video')) {
        mp4Files.push({ fileId, filename });
      }
    }

    console.log(`Tìm thấy ${mp4Files.length} file mp4 trong S02 qua DOM regex:`);
    mp4Files.forEach(f => console.log(` - ${f.filename} => ${f.fileId}`));
  });
});
