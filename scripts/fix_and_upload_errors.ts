import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const EXCEL_PATH_P7 = path.join(process.cwd(), 'Part 7', 'Part 7.xlsx');
const EXCEL_PATH_P6 = path.join(process.cwd(), 'Part 6', 'Part 6.xlsx');

function tryParse(str: string): any {
    if (!str) return null;
    let s = str.trim();
    
    // Attempt 1: Direct parse
    try {
        const p = JSON.parse(s);
        if (typeof p === 'object' && p !== null) return p;
        if (typeof p === 'string') return tryParse(p); // Nested JSON string
    } catch (e) {}

    // Attempt 2: Handle Excel double-quotes escaping ("" -> ")
    try {
        let s2 = s;
        if (s2.startsWith('"') && s2.endsWith('"')) {
            s2 = s2.slice(1, -1);
        }
        s2 = s2.replace(/""/g, '"');
        const p = JSON.parse(s2);
        if (typeof p === 'object' && p !== null) return p;
    } catch (e) {}

    // Attempt 3: Handle escaped quotes (\") and newlines
    try {
        let s3 = s.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\r/g, "\r");
        if (s3.startsWith('"') && s3.endsWith('"')) {
            s3 = s3.slice(1, -1);
        }
        const p = JSON.parse(s3);
        if (typeof p === 'object' && p !== null) return p;
    } catch (e) {}

    // Attempt 4: Clean control characters and try again
    try {
        let s4 = s.replace(/[\u0000-\u001F]/g, " ");
        const p = JSON.parse(s4);
        if (typeof p === 'object' && p !== null) return p;
    } catch (e) {}

    return null;
}

async function processRow(row: any, partId: string) {
    const json = tryParse(row.Json);
    if (!json) {
        throw new Error("Could not parse JSON even with multiple attempts");
    }

    const gMeta = json.group_metadata || {};

    const group = await prisma.toeicQuestionGroup.create({
        data: {
            partId: partId,
            passageText: JSON.stringify(json),
            metadata: {
                Book: String(row.Book).trim(),
                Test: String(row.Test).trim(),
                Part: String(row.Part).trim(),
                QuestionRange: String(row.QuestionRange).trim(),
                passage_type: gMeta.passage_type || gMeta.category || "General",
                complexity: gMeta.complexity || "Single"
            }
        }
    });

    if (json.questions && Array.isArray(json.questions)) {
        for (const q of json.questions) {
            const qNo = q.questionNo || q.id || 0;
            const correct = q.correctAnswer || q.correct || q.correct_answer || "A";
            
            let optA = "", optB = "", optC = "", optD = "";
            if (q.optionA) {
                optA = q.optionA; optB = q.optionB; optC = q.optionC; optD = q.optionD;
            } else if (q.options) {
                optA = q.options.A || ""; optB = q.options.B || ""; optC = q.options.C || ""; optD = q.options.D || "";
            }

            await prisma.toeicQuestion.create({
                data: {
                    groupId: group.id,
                    questionNo: parseInt(qNo.toString()),
                    questionText: q.questionText || q.text || "",
                    optionA: optA,
                    optionB: optB,
                    optionC: optC,
                    optionD: optD,
                    correctAnswer: correct,
                    explanation: JSON.stringify(q.explanation || {}),
                    metadata: {
                        type: q.type || q.question_type || q.Question_Type || "General",
                        evidence_sids: q.evidence_sids || q.clue_sentence_ids || [],
                        explanation_vn: q.explanation || {}
                    }
                }
            });
        }
    }
}

async function main() {
    console.log("🛠️ Starting repair and upload process...");

    const targetP7 = [
        { book: "ETS2023", test: "1", range: "154-155" },
        { book: "ETS2023", test: "1", range: "169-171" },
        { book: "ETS2023", test: "2", range: "168-171" },
        { book: "ETS2023", test: "3", range: "164-167" },
        { book: "ETS2023", test: "4", range: "149-150" },
        { book: "ETS2023", test: "5", range: "176-180" },
        { book: "ETS2023", test: "6", range: "157-158" },
        { book: "ETS2023", test: "7", range: "155-157" },
        { book: "ETS2023", test: "7", range: "172-175" },
        { book: "ETS2023", test: "8", range: "161-163" },
        { book: "ETS2023", test: "8", range: "172-175" },
        { book: "ETS2023", test: "9", range: "172-175" },
        { book: "ETS2023", test: "9", range: "176-180" },
        { book: "ETS2023", test: "10", range: "158-160" },
        { book: "ETS2023", test: "10", range: "168-171" },
        { book: "ETS2023", test: "10", range: "172-175" },
        { book: "ETS2022", test: "1", range: "156-158" },
        { book: "ETS2022", test: "1", range: "161-164" },
        { book: "ETS2026", test: "7", range: "155-157" },
        { book: "ETS2026", test: "8", range: "155-157" },
        { book: "ETS2026", test: "8", range: "161-163" },
        { book: "ETS2026", test: "9", range: "161-164" },
        { book: "ETS2026", test: "9", range: "172-175" },
    ];

    const wb7 = xlsx.readFile(EXCEL_PATH_P7);
    const rows7 = xlsx.utils.sheet_to_json(wb7.Sheets[wb7.SheetNames[0]]);

    for (const target of targetP7) {
        const row = rows7.find((r: any) => 
            String(r.Book).trim() === target.book && 
            String(r.Test).trim() === target.test && 
            String(r.QuestionRange).trim() === target.range
        );

        if (row) {
            try {
                const testTitle = `${target.book} - Test ${target.test}`;
                let test = await prisma.toeicTest.findFirst({ where: { title: testTitle } });
                if (!test) test = await prisma.toeicTest.create({ data: { title: testTitle, isPublished: true } });
                
                let part = await prisma.toeicPart.findFirst({ where: { testId: test.id, partNumber: 7 } });
                if (!part) part = await prisma.toeicPart.create({ data: { testId: test.id, partNumber: 7, title: "Part 7" } });

                // Check if already exists to avoid duplication
                const exists = await prisma.toeicQuestionGroup.findFirst({
                    where: { partId: part.id, metadata: { path: ['QuestionRange'], equals: target.range } }
                });

                if (!exists) {
                    await processRow(row, part.id);
                    console.log(`✅ Fixed & Uploaded: ${target.book} Test ${target.test} ${target.range}`);
                } else {
                    console.log(`ℹ️ ${target.book} Test ${target.test} ${target.range} already exists, skipping.`);
                }
            } catch (err) {
                console.error(`❌ Failed ${target.book} Test ${target.test} ${target.range}: ${(err as Error).message}`);
            }
        }
    }

    console.log("\n✨ Done!");
    await prisma.$disconnect();
}

main();
