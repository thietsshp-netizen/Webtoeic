import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    console.log("Fetching lessons of type YOUTUBE_DICTATION...");
    const lessons = await prisma.lesson.findMany({
      where: {
        contentType: "YOUTUBE_DICTATION",
      },
    });

    console.log(`Found ${lessons.length} lessons to migrate.`);

    // Create backup directory
    const backupDir = path.join(process.cwd(), 'scripts');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup_lessons_before_rename_${timestamp}.json`);
    
    // Backup current states
    fs.writeFileSync(backupPath, JSON.stringify(lessons, null, 2));
    console.log(`Backup of database records created at: ${backupPath}`);

    let updatedCount = 0;

    for (const lesson of lessons) {
      if (!lesson.content) continue;

      try {
        const subtitles = JSON.parse(lesson.content);
        if (!Array.isArray(subtitles)) continue;

        let changed = false;
        const updatedSubtitles = subtitles.map(sub => {
          // If 'note' key exists, rename it to 'slang_and_idiom'
          if (sub && typeof sub === 'object') {
            const newSub = { ...sub };
            if ('note' in newSub) {
              newSub.slang_and_idiom = newSub.note;
              delete newSub.note;
              changed = true;
            } else if (!('slang_and_idiom' in newSub)) {
              newSub.slang_and_idiom = "";
              changed = true;
            }
            return newSub;
          }
          return sub;
        });

        if (changed) {
          await prisma.lesson.update({
            where: { id: lesson.id },
            data: {
              content: JSON.stringify(updatedSubtitles),
            },
          });
          updatedCount++;
        }
      } catch (err) {
        console.error(`Error parsing or updating lesson ${lesson.id}:`, err);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} lessons.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
