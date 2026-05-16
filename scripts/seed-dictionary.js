const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Reading tu-dien.json...');
  const filePath = '/Users/thietphamvan/hoctoeic/Webtoeic/TuDien/tu-dien.json';
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`Preparing to seed ${data.length} words...`);

  // Clear existing entries
  await prisma.dictionary.deleteMany({});
  console.log('Cleared existing dictionary entries.');

  const batchSize = 100; // Smaller batch for adapter
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map(entry => ({
      word: entry.word,
      data: entry
    }));

    await prisma.dictionary.createMany({
      data: batch,
      skipDuplicates: true,
    });

    if (i % 1000 === 0 || i + batchSize >= data.length) {
      console.log(`Seeded ${Math.min(i + batchSize, data.length)} / ${data.length} words`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
