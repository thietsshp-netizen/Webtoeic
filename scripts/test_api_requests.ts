import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function testCourses(adminId: string, studentId: string) {
  console.log("\n--- TESTING COURSES API ---");
  // Simulate logic in src/app/api/me/courses/route.ts
  const targetUserId = studentId;
  const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
  const isAdmin = adminUser?.role === "ADMIN";
  const userId = (isAdmin && targetUserId) ? targetUserId : adminId;

  console.log(`Config: isAdmin=${isAdmin}, targetUserId=${targetUserId}, resolved userId=${userId}`);

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: true
    }
  });
  console.log(`Enrolled courses count for student: ${enrollments.length}`);
  enrollments.forEach(e => console.log(` - Course: ${e.course.title}`));
}

async function testStats(adminId: string, studentId: string) {
  console.log("\n--- TESTING STATS API ---");
  // Simulate logic in src/app/api/me/stats/route.ts
  const targetUserId = studentId;
  const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
  const isAdmin = adminUser?.role === "ADMIN";
  const userId = (isAdmin && targetUserId) ? targetUserId : adminId;

  console.log(`Config: isAdmin=${isAdmin}, targetUserId=${targetUserId}, resolved userId=${userId}`);

  const u = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { name: true, email: true }
  });
  console.log("Viewed User info fetched:", u);
}

async function main() {
  const adminId = "cmnlzn34x0000pwaecbwsswzn"; // thietsshp@gmail.com
  const studentId = "cmsinakky000104l91qe430w4"; // tranthaithangpr@gmail.com

  await testCourses(adminId, studentId);
  await testStats(adminId, studentId);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
