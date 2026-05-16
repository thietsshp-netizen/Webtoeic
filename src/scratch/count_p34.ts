
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function count() {
  const allGroups = await prisma.toeicQuestionGroup.findMany({
    where: { part: { partNumber: { in: [3, 4] } } },
    include: { part: true }
  });

  const stats = {
    part3: { graphic: 0, noGraphic: 0 },
    part4: { graphic: 0, noGraphic: 0 }
  };

  allGroups.forEach(g => {
    const meta = g.metadata as any || {};
    const hasGraphic = (meta.pic_id && String(meta.pic_id).trim() !== "") || 
                       (meta.PicID && String(meta.PicID).trim() !== "") ||
                       (g.imageUrl && g.imageUrl.trim() !== "") ||
                       (String(meta.has_graphic || "").toLowerCase().trim() === "yes");

    const partNum = (g as any).part.partNumber;
    if (partNum === 3) {
      if (hasGraphic) stats.part3.graphic++;
      else stats.part3.noGraphic++;
    } else if (partNum === 4) {
      if (hasGraphic) stats.part4.graphic++;
      else stats.part4.noGraphic++;
    }
  });

  console.log(JSON.stringify(stats, null, 2));
}

count().then(() => prisma.$disconnect());
