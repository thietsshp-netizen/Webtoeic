
import { prisma } from './lib/prisma'

async function main() {
  const groups = await prisma.toeicQuestionGroup.findMany({
    where: { part: { partNumber: 1 } },
    select: { metadata: true }
  })

  const counts: Record<string, number> = {}
  groups.forEach(g => {
    const m = g.metadata as any
    const type = m?.PicType || m?.picType || "Khác"
    counts[type] = (counts[type] || 0) + 1
  })

  console.log("PART 1 CLASSIFICATION:")
  console.log(JSON.stringify(counts, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
