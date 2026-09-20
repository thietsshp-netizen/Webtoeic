// scripts/scrape_friends_drive.mjs
// Script này CHỈ đọc dữ liệu công khai từ Google Drive (không ghi DB, không xoá bất cứ thứ gì)
import https from 'https';

const SEASONS = [
  { season: 1, id: '1Avh3666dnzOjlcT4Ma60mujga1TCLHWv' },
  { season: 2, id: '1KEYNMHMgFaPJVMndeMs0cym7OQ9hi-fK' },
  { season: 3, id: '1K4BLY35wwO8B21yPAoDCkqA8uYWTaBuM' },
  { season: 4, id: '1xD3s8UhyBbnA11ZR45nYv9w_aoFJTkzz' },
  { season: 5, id: '1RTpM_hUMNVxLZgrHzesKaJcYvXFXSEbc' },
  { season: 6, id: '1hXxPrjp4ZMweRKaptFDKg10hGErGvju8' },
  { season: 7, id: '1LvvRCL_qfMk2LZE1RSnurvarFJNadJq2' },
  { season: 8, id: '1oZVY9HJwRS30oTte10svxMqQQwmcI8TB' },
  { season: 9, id: '1eg-ca4ZAXv6_e6UNFT7gZZOD1u_SvZz5' },
  { season: 10, id: '1OBmCAOc8oBpRQYlxKcTtGkNAmI5Rrtma' },
];

function fetchDriveHtml(folderId) {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseFolderFiles(html) {
  const matches = [...html.matchAll(/AF_initDataCallback\(\{key: 'ds:1'[^>]*data:(function\(\)\{return (.*)\}short)/gs)];
  let jsonText = null;
  if (matches.length > 0) {
    jsonText = matches[0][2];
  } else {
    const rawMatches = [...html.matchAll(/AF_initDataCallback\(\{key: 'ds:1'[^>]*data:(.*?)\}\);<\/script>/gs)];
    if (rawMatches.length > 0) {
      jsonText = rawMatches[0][1];
    }
  }

  if (!jsonText) {
    // Thử trích xuất fileId và filename trực tiếp bằng regex nếu mảng phức tạp
    const fileMatches = [];
    const idRegex = /"([a-zA-Z0-9_-]{33})"/g;
    return fileMatches;
  }

  try {
    const data = JSON.parse(jsonText);
    const items = data[27]?.[7]?.[0]?.[0] || [];
    const files = [];
    for (const item of items) {
      const fileId = item[0]?.[1];
      const filename = item[35]?.[0]?.[0]?.[0];
      if (fileId && filename && filename.toLowerCase().endsWith('.mp4')) {
        files.push({ fileId, filename });
      }
    }
    return files;
  } catch (err) {
    console.error("Lỗi parse JSON:", err.message);
    return [];
  }
}

async function main() {
  console.log("=== BẮT ĐẦU QUÉT DỮ LIỆU CÁC TẬP PHIM TRÊN GOOGLE DRIVE ===");
  const allResults = {};

  for (const s of SEASONS) {
    console.log(`Đang quét Season ${s.season}...`);
    const html = await fetchDriveHtml(s.id);
    const files = parseFolderFiles(html);
    console.log(` -> Tìm thấy ${files.length} tập video .mp4`);
    allResults[`S${String(s.season).padStart(2, '0')}`] = files;
  }

  console.log("\n=== TỔNG HỢP KẾT QUẢ QUÉT ĐƯỢC ===");
  let total = 0;
  for (const [season, files] of Object.entries(allResults)) {
    console.log(`${season}: ${files.length} tập`);
    total += files.length;
    if (files.length > 0) {
      console.log(`   Tập mẫu đầu: ${files[0].filename} (ID: ${files[0].fileId})`);
    }
  }
  console.log(`Tổng cộng tìm thấy: ${total} video trên Drive`);
}

main();
