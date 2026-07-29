import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🌱 Starting seeding Part 1 word families...");

  const jsonPath = path.join(process.cwd(), "src/data/part1_word_families.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Source JSON file not found at: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const families = JSON.parse(rawData);

  console.log(`Parsed ${families.length} Part 1 families from JSON.`);

  let createdCount = 0;

  for (const fam of families) {
    if (!fam.key) continue;

    const words = Array.isArray(fam.words)
      ? fam.words.filter((w: any) => typeof w === "string" && w.trim().length > 0)
      : [];

    await prisma.wordFamily.upsert({
      where: { key_part: { key: fam.key, part: 1 } },
      update: {
        words,
        originalValue: fam.originalValue || "",
      },
      create: {
        key: fam.key,
        part: 1,
        words,
        originalValue: fam.originalValue || "",
      },
    });

    createdCount++;
  }

  console.log(`✅ Seeding complete. Upserted ${createdCount} Part 1 word families.`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding Part 1 word families:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
