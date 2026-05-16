
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const lesson = await prisma.lesson.findFirst({
        where: {
            title: 'Từ vựng - Cụm cố định',
            contentType: 'DYNAMIC_PART'
        }
    });

    if (lesson) {
        console.log('Lesson ID:', lesson.id);
        console.log('Content:', lesson.content);
    } else {
        console.log('Lesson not found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
