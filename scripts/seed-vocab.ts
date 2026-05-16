import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const DAY_TITLES: Record<number, string> = {
  1: "Tuyển dụng",
  2: "Phép tắc - Quy định",
  3: "Công việc văn phòng (1)",
  4: "Công việc văn phòng (2)",
  5: "Công việc văn phòng (3)",
  6: "Thời gian rảnh - Cộng đồng",
  7: "Marketing (1)",
  8: "Marketing (2)",
  9: "Kinh tế",
  10: "Mua sắm",
  11: "Phát triển sản phẩm",
  12: "Sản xuất",
  13: "Dịch vụ khách hàng",
  14: "Du lịch - Sân bay",
  15: "Hợp đồng",
  16: "Giao dịch",
  17: "Thương mại - Vận chuyển",
  18: "Nơi lưu trú - Nhà hàng",
  19: "Doanh thu",
  20: "Thi đua trong công ty",
  21: "Xu hướng của doanh nghiệp",
  22: "Hội họp",
  23: "Phúc lợi của nhân viên",
  24: "Luân chuyển nhân sự",
  25: "Giao thông",
  26: "Ngân hàng",
  27: "Đầu tư",
  28: "Tòa nhà - Nhà",
  29: "Môi trường",
  30: "Sức khỏe"
};

async function main() {
  const vocabDir = '/Users/thietphamvan/hoctoeic/Webtoeic/ToeicVocab';
  const files = fs.readdirSync(vocabDir).filter(f => f.endsWith('.txt'));

  console.log(`🔍 Found ${files.length} vocab files.`);

  for (const file of files) {
    const dayMatch = file.match(/Day (\d+)/);
    if (!dayMatch) continue;

    const dayNumber = parseInt(dayMatch[1]);
    const title = DAY_TITLES[dayNumber] || `Day ${dayNumber}`;
    const filePath = path.join(vocabDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract the array from "const data = [...];"
    // Using a simple regex to find the content between the first [ and last ]
    const startIdx = content.indexOf('[');
    const endIdx = content.lastIndexOf(']');
    
    if (startIdx === -1 || endIdx === -1) {
      console.warn(`⚠️ Could not parse file: ${file}`);
      continue;
    }

    const arrayStr = content.substring(startIdx, endIdx + 1);

    // Dùng eval một cách cẩn thận để biến string thành object thực sự (vì nó là JS object literal, không phải JSON chuẩn)
    // Sau đó stringify lại thành JSON chuẩn để lưu vào DB
    let vocabData;
    try {
      vocabData = eval(arrayStr);
    } catch (err) {
      console.error(`❌ Error eval-ing ${file}:`, err);
      continue;
    }

    const jsonData = JSON.stringify(vocabData);

    await prisma.vocabDay.upsert({
      where: { dayNumber },
      update: {
        title,
        data: jsonData
      },
      create: {
        dayNumber,
        title,
        data: jsonData
      }
    });

    console.log(`✅ Imported Day ${dayNumber}: ${title}`);
  }

  console.log('✨ Seed vocab completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
