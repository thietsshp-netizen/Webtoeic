import https from 'https';
import fs from 'fs';
import path from 'path';

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

function decodeHtmlEntities(str) {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseSeasonMp4s(html, seasonNum) {
  const regex = /data-id="([a-zA-Z0-9_-]+)"[^>]*data-tooltip="([^"]+)"/g;
  let match;
  const mp4Map = new Map();

  while ((match = regex.exec(html)) !== null) {
    const fileId = match[1];
    let tooltip = decodeHtmlEntities(match[2]);

    // Google Drive tooltip có dạng: "filename.mp4 Video"
    if (tooltip.toLowerCase().includes('.mp4')) {
      // Bóc tách tên file thực tế
      const filenameMatch = tooltip.match(/(.*?\.mp4)/i);
      const filename = filenameMatch ? filenameMatch[1].trim() : tooltip;

      // Trích xuất mã tập (ví dụ S02E01 hoặc S10E17-18)
      const epMatch = filename.match(/S\d{2}E(\d{2}(?:-E?\d{2}|-\d{2})?)/i);
      const epKey = epMatch ? epMatch[1].toUpperCase() : null;

      if (!mp4Map.has(fileId)) {
        mp4Map.set(fileId, {
          seasonNum,
          fileId,
          filename,
          epKey,
          driveUrl: `https://drive.google.com/file/d/${fileId}/view`
        });
      }
    }
  }

  return Array.from(mp4Map.values()).sort((a, b) => {
    const numA = parseInt(a.epKey || '0', 10);
    const numB = parseInt(b.epKey || '0', 10);
    return numA - numB;
  });
}

async function main() {
  console.log("=== BẮT ĐẦU QUÉT TẤT CẢ 10 SEASON TRÊN GOOGLE DRIVE ===");
  const allSeasonsData = {};
  let grandTotal = 0;

  for (const s of SEASONS) {
    process.stdout.write(`Đang quét Season ${s.season}... `);
    try {
      const html = await fetchDriveHtml(s.id);
      const episodes = parseSeasonMp4s(html, s.season);
      allSeasonsData[`Season_${s.season}`] = episodes;
      grandTotal += episodes.length;
      console.log(`✅ Tìm thấy ${episodes.length} tập video .mp4`);
    } catch (err) {
      console.log(`❌ Lỗi: ${err.message}`);
    }
  }

  const outputPath = path.join(process.cwd(), 'scripts', 'friends_drive_videos.json');
  fs.writeFileSync(outputPath, JSON.stringify(allSeasonsData, null, 2));

  console.log("------------------------------------------------------");
  console.log(`✅ ĐÃ LƯU KẾT QUẢ VÀO FILE: ${outputPath}`);
  console.log(`🎉 Tổng số tập phim tìm thấy: ${grandTotal} tập`);
}

main();
