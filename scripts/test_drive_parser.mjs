import https from 'https';

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

function extractDataArray(html) {
  const marker = "AF_initDataCallback({key: 'ds:1'";
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return null;

  const dataKey = "data:";
  const dataPos = html.indexOf(dataKey, startIdx);
  if (dataPos === -1) return null;

  let bracketStart = html.indexOf('[', dataPos);
  if (bracketStart === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = bracketStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '[') depth++;
      else if (ch === ']') {
        depth--;
        if (depth === 0) {
          const jsonStr = html.substring(bracketStart, i + 1);
          return JSON.parse(jsonStr);
        }
      }
    }
  }
  return null;
}

async function test() {
  const html = await fetchDriveHtml('1KEYNMHMgFaPJVMndeMs0cym7OQ9hi-fK');
  const parsed = extractDataArray(html);
  
  // Tìm tất cả các string kết thúc bằng .mp4 và ID lân cận trong cây JSON
  const results = [];
  function search(node, path = '') {
    if (!node) return;
    if (typeof node === 'string') {
      if (node.endsWith('.mp4') || node.includes('S02E')) {
        results.push({ val: node, path });
      }
    } else if (Array.isArray(node)) {
      node.forEach((item, idx) => search(item, `${path}[${idx}]`));
    } else if (typeof node === 'object') {
      for (const k of Object.keys(node)) {
        search(node[k], `${path}.${k}`);
      }
    }
  }
  search(parsed);
  console.log(`Tìm thấy ${results.length} chuỗi liên quan:`);
  results.slice(0, 10).forEach(r => console.log(`${r.path} => ${r.val}`));
}

test();
