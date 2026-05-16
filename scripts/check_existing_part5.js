
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const part5 = await prisma.toeicPart.findFirst({
            where: { partNumber: 5 },
            include: {
                groups: {
                    take: 1,
                    include: {
                        questions: true
                    }
                }
            }
        });

        console.log(JSON.stringify(part5, null, 2));
    } catch (e) {
        console.error('Error during database query:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
