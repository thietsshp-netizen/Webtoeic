
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const tests = await prisma.toeicTest.findMany({
    where: {
      title: { contains: "Ngày 11" }
    },
    include: {
      parts: {
        where: { partNumber: 4 },
        include: {
          groups: {
            include: { questions: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  })

  if (tests.length === 0) {
    console.log("Không tìm thấy bài thi có tiêu đề 'Ngày 11'")
    return
  }

  tests.forEach(test => {
    console.log(`Bài thi: ${test.id} - ${test.title}`)
    test.parts.forEach(part => {
      console.log(`Part: ${part.partNumber}`)
      part.groups.forEach((group, index) => {
        const qNos = group.questions.map(q => q.questionNo).join('-')
        console.log(`${index + 1}. Nhóm ${qNos}: ImageURL = "${group.imageUrl}", hasPicID = ${!!group.imageUrl}`)
      })
    })
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
