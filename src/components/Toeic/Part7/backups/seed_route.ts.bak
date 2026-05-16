import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const excelPath = "/Users/thietphamvan/hoctoeic/Webtoeic/Part 7/Part 7 ETS2026_Test 9_2.xlsx";
    
    if (!fs.existsSync(excelPath)) {
      return NextResponse.json({ success: false, error: "Excel file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(excelPath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    let seededGroups = 0;
    let seededQuestions = 0;

    for (const row of data) {
      const { Book, Test, Part, Json, Day } = row;
      const parsedJson = JSON.parse(Json);
      const bookTitle = Book;
      const testTitle = Test;
      
      const fullTestTitle = `${bookTitle} - ${testTitle}`;

      // 1. Find or Create ToeicTest
      let test = await prisma.toeicTest.findFirst({
        where: { title: fullTestTitle }
      });

      if (!test) {
        test = await prisma.toeicTest.create({
          data: {
            title: fullTestTitle,
            description: `Seeded from Excel - Day ${Day}`,
            isPublished: true,
          }
        });
      }

      // 2. Find or Create ToeicPart
      let toeicPart = await prisma.toeicPart.findFirst({
        where: { testId: test.id, partNumber: Number(Part) }
      });

      if (!toeicPart) {
        toeicPart = await prisma.toeicPart.create({
          data: {
            testId: test.id,
            partNumber: Number(Part),
            title: `Part ${Part}: Reading Comprehension`,
          }
        });
      }

      // 3. Create or Update ToeicQuestionGroup
      // We use QuestionRange or metadata to identify uniqueness if needed, 
      // but here we'll use first question number as a key
      const firstQNo = parsedJson.questions[0].questionNo;

      const groupData = {
        partId: toeicPart.id,
        passageText: JSON.stringify(parsedJson.passages), // Multi-passages stored as JSON array
        metadata: {
          book: bookTitle,
          test: testTitle,
          day: Day,
          intro_text: parsedJson.group_metadata.intro_text,
          intro_text_vn: parsedJson.group_metadata.intro_text_vn,
          complexity: parsedJson.group_metadata.complexity,
          passage_count: parsedJson.group_metadata.passage_count
        }
      };

      // Check if group exists (based on partId and day/test metadata to avoid duplicates)
      const existingGroup = await prisma.toeicQuestionGroup.findFirst({
        where: {
          partId: toeicPart.id,
          metadata: {
            path: ['day'],
            equals: Day
          },
          AND: {
            questions: {
              some: {
                questionNo: firstQNo
              }
            }
          }
        }
      });

      const group = await prisma.toeicQuestionGroup.upsert({
        where: { id: existingGroup?.id || 'new-id' },
        update: groupData,
        create: groupData
      });

      seededGroups++;

      // 4. Create or Update ToeicQuestions
      for (const q of parsedJson.questions) {
        const qData = {
          groupId: group.id,
          questionNo: q.questionNo,
          questionText: q.questionText,
          optionA: q.options.A,
          optionB: q.options.B,
          optionC: q.options.C,
          optionD: q.options.D,
          correctAnswer: q.correctAnswer,
          explanation: JSON.stringify({
            why_correct: q.explanation.why_correct,
            wrong: q.explanation.wrong_options,
          }),
          metadata: {
            questionText_vn: q.questionText_vn,
            options_vn: q.options_vn,
            evidence_sids: q.evidence_sids,
            highlight_color: q.highlight_color,
            type: q.type
          }
        };

        const existingQ = await prisma.toeicQuestion.findFirst({
          where: { groupId: group.id, questionNo: q.questionNo }
        });

        await prisma.toeicQuestion.upsert({
          where: { id: existingQ?.id || 'new-q-id' },
          update: qData,
          create: qData
        });

        seededQuestions++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${seededGroups} groups and ${seededQuestions} questions successfully!` 
    });

  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
