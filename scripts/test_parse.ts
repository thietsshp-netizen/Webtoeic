import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const currentGroup = await prisma.toeicQuestionGroup.findUnique({
    where: { id: "cmsvoqcuwj25ko1g7ccg" }
  });
  if (!currentGroup) return;

  const moveSuperscriptToEnd = (htmlStr: string) => {
    if (!htmlStr) return "";
    const supRegex = /<sup[^>]*>([\s\S]*?)<\/sup>/i;
    const match = htmlStr.match(supRegex);
    if (match) {
      const supContent = match[1].trim();
      const cleanStr = htmlStr.replace(supRegex, "").trim();
      return `${cleanStr} <sup>${supContent}</sup>`;
    }
    return htmlStr;
  };

  try {
    const mj = (currentGroup.metadata as any)?.Json;
    const pj = typeof mj === 'string' ? JSON.parse(mj) : mj;
    if (pj?.passages && Array.isArray(pj.passages) && pj.passages.length > 0) {
      const p = pj.passages[0];
      const html = p.html_content || "";
      const tMap = p.translation_map || {};

      const sentences: any[] = [];
      const regex = /data-sid=['"]([^'"]+)['"]>([\s\S]*?)<\/div>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const rawContent = match[2];
        const speakerMatch = rawContent.match(/^<b>(.*?):<\/b>/);
        let speaker = speakerMatch ? speakerMatch[1].trim() : "";

        const cleanEnglish = rawContent
          .replace(/<sup[^>]*>.*?<\/sup>/g, "")
          .replace(/^<b>(.*?):<\/b>/g, "")
          .replace(/\^{.*?}/g, "")
          .replace(/<[^>]*>/g, "")
          .trim();

        const rawTranslation = tMap[match[1]] || "";
        const processedTranslation = moveSuperscriptToEnd(rawTranslation);

        sentences.push({
          id: match[1],
          speaker,
          english: cleanEnglish,
          viText: processedTranslation.replace(/<[^>]*>/g, "").trim()
        });
      }
      console.log("Parsed sentences length:", sentences.length);
      console.log("First 3 sentences:", JSON.stringify(sentences.slice(0, 3), null, 2));
    } else {
      console.log("Structure not matched");
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

main().catch(console.error);
