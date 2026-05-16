import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if userVocabulary is a property
    if ('userVocabulary' in prisma) {
      console.log("SUCCESS: userVocabulary found in prisma client.");
      const count = await (prisma as any).userVocabulary.count();
      console.log("Count:", count);
      
      const first = await (prisma as any).userVocabulary.findFirst();
      if (first) {
        console.log("Fields in record:", Object.keys(first));
        if ('wordFamily' in first) {
          console.log("SUCCESS: wordFamily field found in record!");
        } else {
          console.log("FAILURE: wordFamily field MISSING in record.");
        }
      }
    } else {
      console.log("FAILURE: userVocabulary property NOT FOUND in prisma client.");
      console.log("Available properties:", Object.keys(prisma).filter(k => !k.startsWith('_')));
    }
  } catch (e) {
    console.error("ERROR during test:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
