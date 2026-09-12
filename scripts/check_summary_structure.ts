import { prisma } from "../src/lib/prisma";

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { id: "cnmwil7sh3llvss8h6ye8y" }
  });
  if (!lesson || !lesson.content) return;
  const passages = JSON.parse(lesson.content);
  const p3 = passages[2];
  const g4 = p3.question_groups?.[3];
  
  console.log("=== GROUP 4 SUMMARY_COMPLETION_TEXT DETAILS ===");
  console.log("GroupKeys:", Object.keys(g4));
  console.log("Group text:", g4.text);
  console.log("Group summary_text:", g4.summary_text);
  
  const q38 = g4.questions?.[0];
  const q39 = g4.questions?.[1];
  const q40 = g4.questions?.[2];
  
  console.log("\nQuestion 38 keys:", Object.keys(q38));
  console.log("Question 38 Text:", JSON.stringify(q38.text));
  console.log("Question 38 Full:", JSON.stringify(q38, null, 2));
  console.log("\nQuestion 39 Text:", JSON.stringify(q39.text));
  console.log("\nQuestion 40 Text:", JSON.stringify(q40.text));
}

main().catch(console.error).finally(() => prisma.$disconnect());
