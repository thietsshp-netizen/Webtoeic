
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanTypes() {
    const questions = await prisma.toeicQuestion.findMany({
        where: {
            group: {
                part: {
                    partNumber: 5
                }
            }
        }
    });

    console.log(`Checking ${questions.length} questions...`);

    let updatedCount = 0;
    for (const q of questions) {
        const meta = q.metadata;
        if (meta && meta.Question_Type) {
            const original = meta.Question_Type;
            const trimmed = original.trim();
            if (original !== trimmed) {
                const newMeta = { ...meta, Question_Type: trimmed };
                await prisma.toeicQuestion.update({
                    where: { id: q.id },
                    data: { metadata: newMeta }
                });
                updatedCount++;
            }
        }
    }

    console.log(`Cleaned up ${updatedCount} questions.`);
}

cleanTypes()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
