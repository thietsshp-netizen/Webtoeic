import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputDir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/ToeicVocab/images';
const outputDir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/Webtoeic/ToeicVocab/images_webp';

async function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir).filter(f => !f.startsWith('.') && /\.(png|jpe?g|bmp|tiff)$/i.test(f));
  console.log(`Bắt đầu chuyển đổi ${files.length} ảnh sang WebP...`);

  const startTime = Date.now();
  let totalInputSize = 0;
  let totalOutputSize = 0;
  let convertedCount = 0;

  // Process in concurrent batches of 20
  const BATCH_SIZE = 20;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (file) => {
        const inputPath = path.join(inputDir, file);
        const nameWithoutExt = path.parse(file).name;
        const outputPath = path.join(outputDir, `${nameWithoutExt}.webp`);

        const inStat = fs.statSync(inputPath);
        totalInputSize += inStat.size;

        await sharp(inputPath)
          .webp({ quality: 82, effort: 4 })
          .toFile(outputPath);

        const outStat = fs.statSync(outputPath);
        totalOutputSize += outStat.size;
        convertedCount++;
      })
    );

    if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= files.length) {
      console.log(`Đã chuyển đổi: ${Math.min(i + BATCH_SIZE, files.length)} / ${files.length} ảnh...`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const inMB = (totalInputSize / (1024 * 1024)).toFixed(1);
  const outMB = (totalOutputSize / (1024 * 1024)).toFixed(1);
  const savedPercent = (((totalInputSize - totalOutputSize) / totalInputSize) * 100).toFixed(1);

  console.log('\n=========================================');
  console.log(`✅ Hoàn thành chuyển đổi ${convertedCount} ảnh trong ${durationSec} giây!`);
  console.log(`📁 Thư mục lưu ảnh mới: ${outputDir}`);
  console.log(`📉 Dung lượng gốc (PNG): ${inMB} MB`);
  console.log(`📉 Dung lượng mới (WebP): ${outMB} MB`);
  console.log(`🎉 Tiết kiệm được: ${savedPercent}% dung lượng!`);
  console.log('=========================================');
}

main().catch(err => {
  console.error('Lỗi chuyển đổi:', err);
  process.exit(1);
});
