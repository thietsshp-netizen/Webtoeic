require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const R2_BASE = 'https://pub-a270e288fced4421a7e23ed68853d699.r2.dev';

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve({ statusCode: res.statusCode });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== QUÉT VÀ KIỂM TRA DỮ LIỆU PART 3 VÀ PART 4 ===\n');

  const groups = await prisma.toeicQuestionGroup.findMany({
    where: {
      part: {
        partNumber: { in: [3, 4] }
      }
    },
    include: {
      part: {
        include: {
          test: true
        }
      },
      questions: {
        orderBy: { questionNo: 'asc' }
      }
    },
    orderBy: [
      { part: { testId: 'asc' } },
      { part: { partNumber: 'asc' } },
      { id: 'asc' }
    ]
  });

  console.log(`Tìm thấy tổng cộng ${groups.length} nhóm câu hỏi (Question Groups) cho Part 3 & 4.`);

  let totalQuestions = 0;
  let audioUrls = [];
  let imageUrls = [];

  let groupsWithImage = 0;
  let groupsWithoutImage = 0;
  let invalidQuestionCounts = [];

  for (const g of groups) {
    const qCount = g.questions.length;
    totalQuestions += qCount;

    if (qCount !== 3) {
      invalidQuestionCounts.push({
        groupId: g.id,
        test: g.part?.test?.title,
        part: g.part?.partNumber,
        questionCount: qCount,
        qNos: g.questions.map(q => q.questionNo)
      });
    }

    if (g.audioUrl) {
      audioUrls.push({ groupId: g.id, url: g.audioUrl });
    }
    if (g.imageUrl) {
      groupsWithImage++;
      imageUrls.push({ groupId: g.id, url: g.imageUrl });
    } else {
      groupsWithoutImage++;
    }
  }

  console.log(`- Tổng số câu hỏi: ${totalQuestions} câu`);
  console.log(`- Số cụm có hình ảnh: ${groupsWithImage} cụm`);
  console.log(`- Số cụm không có hình ảnh: ${groupsWithoutImage} cụm`);
  console.log(`- Số cụm có Audio: ${audioUrls.length} cụm`);

  if (invalidQuestionCounts.length > 0) {
    console.log(`\n⚠️ CẢNH BÁO: Có ${invalidQuestionCounts.length} cụm không đủ 3 câu hỏi!`);
    console.log(invalidQuestionCounts.slice(0, 5));
  } else {
    console.log('\n✅ Tất cả các cụm Part 3 & 4 đều có đúng 3 câu hỏi / cụm.');
  }

  // Sample check R2 paths for Audio and Image
  console.log('\n=== KIỂM TRA SỰ TỒN TẠI TRÊN CLOUDFLARE R2 ===');
  
  // Sample check 10 audio files and 10 image files to verify path pattern
  console.log('\n1. Mẫu thử Audio URL khi chuyển sang R2:');
  const sampleAudio = audioUrls.slice(0, 5);
  for (const a of sampleAudio) {
    // Current URL format: https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/lessons/toeic_part3_4/Audio/ETS2026_PART34/ETS2026_TEST_01_32_34.mp3
    // or similar
    const relativePath = a.url.replace('https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/lessons/', '');
    const r2Url = `${R2_BASE}/${relativePath}`;
    const res = await checkUrl(r2Url);
    console.log(`Audio DB: ${a.url}\n  -> R2 URL: ${r2Url} => Status: ${res.statusCode || res.error}`);
  }

  console.log('\n2. Mẫu thử Image URL khi chuyển sang R2:');
  const sampleImage = imageUrls.slice(0, 5);
  for (const img of sampleImage) {
    const relativePath = img.url.replace('https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/lessons/', '');
    const r2Url = `${R2_BASE}/${relativePath}`;
    const res = await checkUrl(r2Url);
    console.log(`Image DB: ${img.url}\n  -> R2 URL: ${r2Url} => Status: ${res.statusCode || res.error}`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Lỗi khi kiểm tra:', err);
  process.exit(1);
});
