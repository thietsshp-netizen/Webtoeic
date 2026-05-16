
require('dotenv').config();
const xlsx = require('xlsx');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function uploadPart6() {
    console.log("--- START UPLOADING PART 6 ---");

    // 1. Read Excel
    const workbook = xlsx.readFile("/Users/thietphamvan/hoctoeic/Webtoeic/Part 6/Part 6.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    console.log(`Found ${rows.length} passages (rows) in Excel.`);

    // 2. Clear existing Part 6
    const deletedParts = await prisma.toeicPart.deleteMany({
        where: { partNumber: 6 }
    });
    console.log(`Cleared ${deletedParts.count} existing Part 6 records.`);

    let successCount = 0;
    for (const row of rows) {
        try {
            const { Book, Test, Part, QuestionRange, Json } = row;
            const jsonContent = JSON.parse(Json);
            
            // Find or Create ToeicTest
            const testTitle = `${Book} - Test ${Test}`;
            let toeicTest = await prisma.toeicTest.findFirst({
                where: { title: testTitle }
            });

            if (!toeicTest) {
                toeicTest = await prisma.toeicTest.create({
                    data: { title: testTitle, description: `Bộ đề từ ${Book}` }
                });
                console.log(`Created new Test: ${testTitle}`);
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
                    passageText: JSON.stringify(jsonContent.passage), // Store the passage object as JSON string
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
                        questionNo: q.id || q.questionNo, // Use q.id if questionNo is missing
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
                            explanation_vn: q.explanation // Map full explanation object for UI
                        }
                    }
                });
            }

            successCount++;
            if (successCount % 10 === 0) console.log(`Processed ${successCount} passages...`);

        } catch (err) {
            console.error(`Error processing row (Book: ${row.Book}, Test: ${row.Test}):`, err);
        }
    }

    console.log(`--- UPLOAD COMPLETED: ${successCount} passages inserted. ---`);
}

uploadPart6()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
