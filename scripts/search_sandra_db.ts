import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Searching for 'Sandra' in all ToeicQuestionGroup transcripts/metadata...");
  const groups = await prisma.toeicQuestionGroup.findMany({
    include: {
      questions: true
    }
  });

  const matched = groups.filter(g => {
    const transcriptStr = g.transcript ? JSON.stringify(g.transcript) : "";
    const metadataStr = g.metadata ? JSON.stringify(g.metadata) : "";
    return transcriptStr.toLowerCase().includes("sandra") || metadataStr.toLowerCase().includes("sandra");
  });

  console.log(`Found ${matched.length} matching groups in DB:`);
  matched.forEach(g => {
    console.log(`- ID: ${g.id}, AudioURL: ${g.audioUrl}`);
    console.log(`  Transcript length: ${g.transcript ? JSON.stringify(g.transcript).length : 0}`);
    console.log(`  Metadata keys: ${g.metadata ? Object.keys(g.metadata as any).join(', ') : 'none'}`);
    console.log(`  Questions: ${g.questions.map(q => q.questionNo).join(', ')}`);
  });
}

main().catch(console.error);
