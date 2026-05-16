
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const questions = await prisma.toeicQuestion.findMany({
        where: {
            group: {
                part: {
                    partNumber: 5
                }
            }
        },
        select: {
            metadata: true
        }
    });

    const types = new Set();
    questions.forEach(q => {
        if (q.metadata && q.metadata.Question_Type) {
            types.add(q.metadata.Question_Type);
        }
    });

    console.log('Unique Question Types:', Array.from(types).sort());
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
