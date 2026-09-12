import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Querying group cm06516bl90l3e7o14l5cvs1s...");
  const group = await prisma.toeicQuestionGroup.findUnique({
    where: {
      id: "cm06516bl90l3e7o14l5cvs1s"
    },
    include: {
      questions: true
    }
  });

  if (!group) {
    console.log("Group not found!");
    return;
  }

  console.log("Group ID:", group.id);
  console.log("Group audioUrl:", group.audioUrl);
  console.log("Group transcript:", typeof group.transcript, JSON.stringify(group.transcript, null, 2));
  console.log("Group metadata:", typeof group.metadata, JSON.stringify(group.metadata, null, 2));
  console.log("Questions:");
  group.questions.forEach(q => {
    console.log(`- Q${q.questionNo}: correctAnswer=${q.correctAnswer}, metadata=${JSON.stringify(q.metadata)}`);
  });
}

main().catch(console.error);
