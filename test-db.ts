import fs from 'fs';
import path from 'path';
import { prisma } from './src/lib/prisma';

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Keep only letters and numbers
    .trim();
}

async function main() {
  const dirPath = path.join(process.cwd(), "10 gramma lesson");
  const files = fs.readdirSync(dirPath).filter(file => file.endsWith(".json"));

  console.log("Analyzing matches between JSON questions and database...");

  // We are interested in lessons 3 to 8
  const targetedLessons = [3, 4, 5, 6, 7, 8];

  for (const filename of files) {
    const match = filename.match(/\d+/);
    const index = match ? parseInt(match[0], 10) : -1;

    if (!targetedLessons.includes(index)) continue;

    const filePath = path.join(dirPath, filename);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const jsonQuestions: any[] = [];

    if (data.practice?.parts) {
      data.practice.parts.forEach((part: any) => {
        if (part.questions) {
          jsonQuestions.push(...part.questions);
        }
      });
    }

    console.log(`\nLesson ${index}: "${data.theory?.title || filename}"`);
    console.log(`- Total questions in JSON: ${jsonQuestions.length}`);

    let matchedCount = 0;
    for (const q of jsonQuestions) {
      const qText = q.questionText || "";
      if (!qText) continue;

      // Extract the main part of the sentence (strip numbers like "1. ", placeholders, etc.)
      const cleaned = qText
        .replace(/^\d+\.\s*/, '') // Remove question numbers
        .replace(/[-_]{3,}/g, '') // Remove placeholders like -----
        .trim();

      const normalized = normalizeText(cleaned);
      if (normalized.length < 10) continue;

      // Search DB
      const dbMatches = await prisma.toeicQuestion.findMany({
        where: {
          group: {
            part: {
              partNumber: 5
            }
          }
        },
        select: {
          id: true,
          questionText: true
        }
      });

      // Simple similarity check
      const matchInDb = dbMatches.find(dbQ => {
        const dbText = dbQ.questionText || "";
        const dbNormalized = normalizeText(dbText);
        return dbNormalized.includes(normalized) || normalized.includes(dbNormalized);
      });

      if (matchInDb) {
        matchedCount++;
        console.log(`  ✓ Match found for: "${cleaned.substring(0, 50)}..." -> DB ID: ${matchInDb.id}`);
      }
    }

    console.log(`- Matched with DB: ${matchedCount} / ${jsonQuestions.length} questions`);
  }
}
main();
