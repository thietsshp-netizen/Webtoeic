
require('dotenv').config();
const xlsx = require('xlsx');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function uploadPart6Fix() {
    console.log("--- START UPLOADING FIXED PART 6 ROWS ---");

    const workbook = xlsx.readFile("/Users/thietphamvan/hoctoeic/Webtoeic/Part 6/Part 6.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const targetFixes = [
        { Book: 'ETS2026', Test: 10 },
        { Book: 'ETS2022', Test: 6 },
        { Book: 'ETS2022', Test: 9 }
    ];

    // 1. Clean up target tests first to avoid duplicates
    for (const target of targetFixes) {
        const testTitle = `${target.Book} - Test ${target.Test}`;
        const toeicTest = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
        if (toeicTest) {
            const toeicPart = await prisma.toeicPart.findFirst({ 
                where: { testId: toeicTest.id, partNumber: 6 } 
            });
            if (toeicPart) {
                await prisma.toeicQuestionGroup.deleteMany({ where: { partId: toeicPart.id } });
                console.log(`Cleared existing Part 6 data for ${testTitle}`);
            }
        }
    }

    let fixedCount = 0;
    for (const row of rows) {
        const isTarget = targetFixes.some(f => 
            String(row.Book) === String(f.Book) && 
            String(row.Test) === String(f.Test)
        );

        if (!isTarget) continue;
        // ... (rest of the upload logic remains the same)

        try {
            const { Book, Test, Part, QuestionRange, Json } = row;
            const jsonContent = JSON.parse(Json);
            console.log(`Processing fixed row: ${Book} - Test ${Test}`);
            
            // Find or Create ToeicTest
            const testTitle = `${Book} - Test ${Test}`;
            let toeicTest = await prisma.toeicTest.findFirst({
                where: { title: testTitle }
            });

            if (!toeicTest) {
                toeicTest = await prisma.toeicTest.create({
                    data: { title: testTitle, description: `Bộ đề từ ${Book}` }
                });
            }

            // Find or Create ToeicPart
            let toeicPart = await prisma.toeicPart.findFirst({
                where: {
                    testId: toeicTest.id,
                    partNumber: 6
                }
            });

            if (!toeicPart) {
                toeicPart = await prisma.toeicPart.create({
                    data: {
                        testId: toeicTest.id,
                        partNumber: 6,
                        title: `Reading Part 6 - ${testTitle}`
                    }
                });
            }

            // Create Question Group (Passage)
            const group = await prisma.toeicQuestionGroup.create({
                data: {
                    partId: toeicPart.id,
                    passageText: JSON.stringify(jsonContent.passage),
                    metadata: {
                        Book: Book,
                        Test: Test,
                        QuestionRange: QuestionRange,
                        PassageType: jsonContent.PassageType || 'Unknown'
                    }
                }
            });

            // Create 4 Questions
            const questions = jsonContent.questions || [];
            for (const q of questions) {
                await prisma.toeicQuestion.create({
                    data: {
                        groupId: group.id,
                        questionNo: q.id || q.questionNo,
                        questionText: q.questionText || '',
                        optionA: q.options?.A || q.optionA || '',
                        optionB: q.options?.B || q.optionB || '',
                        optionC: q.options?.C || q.optionC || '',
                        optionD: q.options?.D || q.optionD || '',
                        correctAnswer: q.correct_answer || q.correctAnswer || '',
                        explanation: q.explanation?.why_correct || '',
                        metadata: {
                            ...q,
                            Book: Book,
                            Test: Test,
                            Part: 6,
                            explanation_vn: q.explanation
                        }
                    }
                });
            }

            fixedCount++;
            console.log(`Successfully uploaded: ${Book} - Test ${Test}`);

        } catch (err) {
            console.error(`Error processing fixed row (${row.Book} - Test ${row.Test}):`, err);
        }
    }

    console.log(`--- FINISHED: Uploaded ${fixedCount} fixed rows. ---`);
}

uploadPart6Fix()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
