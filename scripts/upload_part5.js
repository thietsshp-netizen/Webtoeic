
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const excelFilePath = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 5/Part 5 - tong hop_phanLoai--.xlsx';

async function uploadData() {
    console.log('Starting Part 5 data upload process...');

    try {
        // 1. Read Excel file
        const workbook = XLSX.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`Read ${data.length} rows from Excel.`);

        // 2. Delete existing Part 5 data
        // We delete by partNumber = 5
        const deletedParts = await prisma.toeicPart.deleteMany({
            where: { partNumber: 5 }
        });
        console.log(`Deleted ${deletedParts.count} existing Part 5 records (and cascaded groups/questions).`);

        // 3. Group data by Book and Test to manage ToeicTest/ToeicPart creation efficiently
        const groupsByTest = {};
        data.forEach(row => {
            const book = row.Book;
            const testNo = row.Test;
            const key = `${book}_Test_${testNo}`;
            if (!groupsByTest[key]) {
                groupsByTest[key] = {
                    book,
                    testNo,
                    rows: []
                };
            }
            groupsByTest[key].rows.push(row);
        });

        console.log(`Grouped into ${Object.keys(groupsByTest).length} tests.`);

        let totalQuestions = 0;

        for (const key in groupsByTest) {
            const { book, testNo, rows } = groupsByTest[key];
            const testTitle = `${book} Test ${testNo}`;

            // Find or create ToeicTest
            let test = await prisma.toeicTest.findFirst({
                where: { title: testTitle }
            });

            if (!test) {
                test = await prisma.toeicTest.create({
                    data: {
                        title: testTitle,
                        description: `Automatically created from ${book}`,
                        isPublished: true
                    }
                });
                console.log(`Created new Test: ${testTitle}`);
            }

            // Create ToeicPart for this test
            const part = await prisma.toeicPart.create({
                data: {
                    testId: test.id,
                    partNumber: 5,
                    title: 'Incomplete Sentences'
                }
            });

            // Create Questions
            for (const row of rows) {
                let jsonContent;
                try {
                    jsonContent = JSON.parse(row.Json);
                } catch (e) {
                    console.error(`Error parsing JSON for Question ${row.QuestionNo} in ${testTitle}:`, e.message);
                    continue;
                }

                // Create Group (1 group per question for Part 5)
                const group = await prisma.toeicQuestionGroup.create({
                    data: {
                        partId: part.id,
                        metadata: {
                            book: book,
                            test: testNo
                        }
                    }
                });

                // Create Question
                await prisma.toeicQuestion.create({
                    data: {
                        groupId: group.id,
                        questionNo: parseInt(row.QuestionNo),
                        questionText: jsonContent.questionText || '',
                        optionA: jsonContent.optionA || '',
                        optionB: jsonContent.optionB || '',
                        optionC: jsonContent.optionC || '',
                        optionD: jsonContent.optionD || '',
                        correctAnswer: (jsonContent.correctAnswer || row.Correct_Answer || '').trim(),
                        explanation: jsonContent.explanation?.why_correct || '',
                        metadata: {
                            ...jsonContent,
                            book: book,
                            test: testNo,
                            part: 5
                        }
                    }
                });
                totalQuestions++;
            }
            console.log(`Finished uploading ${rows.length} questions for ${testTitle}`);
        }

        console.log(`\nUpload complete! Total Questions: ${totalQuestions}`);

    } catch (error) {
        console.error('Error during upload process:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

uploadData();
