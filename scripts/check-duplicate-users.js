const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkAllUsers() {
  const email = 'thietsshp@toeicthiet.com';
  console.log('Searching for all users with email:', email);
  
  try {
    const users = await prisma.user.findMany({
      where: { email }
    });

    console.log('Found', users.length, 'user records.');
    users.forEach(u => {
      console.log(' - ID:', u.id, '| Name:', u.name);
    });

    // Check sessions/accounts
    const accounts = await prisma.account.findMany({
      where: { userId: { in: users.map(u => u.id) } }
    });
    console.log('Found', accounts.length, 'associated OAuth accounts.');
    accounts.forEach(a => {
      console.log(' - UserID:', a.userId, '| Provider:', a.provider);
    });

  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkAllUsers();
