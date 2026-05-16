
import { prisma } from './lib/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

async function wipePart1() {
  console.log("Starting Part 1 data wipe...");
  
  try {
    // 1. Find all Part 1 records
    const part1s = await prisma.toeicPart.findMany({
      where: { partNumber: 1 },
      select: { id: true }
    });

    const partIds = part1s.map(p => p.id);
    console.log(`Found ${partIds.length} Part 1 records.`);

    if (partIds.length > 0) {
      // 2. Delete all question groups (questions will be deleted via cascade)
      const deleteResult = await prisma.toeicQuestionGroup.deleteMany({
        where: { partId: { in: partIds } }
      });
      console.log(`Deleted ${deleteResult.count} Question Groups for Part 1.`);
    } else {
      console.log("No Part 1 records found to delete.");
    }

    console.log("Wipe completed successfully.");
  } catch (err) {
    console.error("Error during wipe:", err);
  } finally {
    await prisma.$disconnect();
  }
}

wipePart1();
