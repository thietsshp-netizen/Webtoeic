const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUserVocab() {
  const email = 'thietsshp@toeicthiet.com';
  console.log('Checking for user:', email);
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userVocabs: true
      }
    });

    if (!user) {
      console.log('User NOT found!');
      return;
    }

    console.log('User found! ID:', user.id);
    console.log('Vocab count:', user.userVocabs.length);
    if (user.userVocabs.length > 0) {
      console.log('Last 5 words:', user.userVocabs.slice(-5).map(v => v.word).join(', '));
    } else {
      console.log('User has NO starred words in UserVocabulary table.');
    }

    // Check VocabBookmark
    try {
       const bookmarks = await prisma.vocabBookmark.findMany({
         where: { userId: user.id }
       });
       console.log('VocabBookmark count:', bookmarks.length);
    } catch(e) {}

  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkUserVocab();
