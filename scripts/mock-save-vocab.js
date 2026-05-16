const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function mockSave() {
  const userId = 'cmnqdqtov0000rraexfvqldj3';
  console.log('Mock saving for user:', userId);
  
  try {
    const newVocab = await prisma.userVocabulary.create({
      data: {
        userId: userId,
        word: 'product',
        partOfSpeech: 'Noun',
        definition: 'Sản phẩm/Vật phẩm/Kết quả',
        translation: 'Sản phẩm',
        ipa: '/ˈprɒd.ʌkt/',
        example: 'The company is launching a new product next month.',
        exampleTranslation: 'Công ty sẽ tung ra một sản phẩm mới vào tháng tới.'
      }
    });

    console.log('Successfully saved word:', newVocab.word);

  } catch (err) {
    console.error('Error during mock save:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

mockSave();
