import { prisma } from '@/lib/prisma';
import ToeicPart7Player from "@/components/Toeic/Part7/ToeicPart7Player";
import { AdminEditProvider } from "@/components/Admin/AdminEditProvider";

export default async function TestPart7Page() {
  // Fetch all Part 7 groups
  const groups = await prisma.toeicQuestionGroup.findMany({
    where: { part: { partNumber: 7 } },
    include: {
      questions: {
        orderBy: { questionNo: 'asc' }
      }
    }
  });

  if (!groups || groups.length === 0) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-700 mb-4">Chưa có dữ liệu Part 7</h1>
        <p className="text-slate-500 mb-8">Vui lòng chạy seeder /api/seed-toeic/part7 trước.</p>
      </div>
    );
  }

  // To view all, we can just pass the entire groups array to the player
  // You can set isReviewMode=true to see answers immediately
  return (
    <AdminEditProvider>
      <div className="w-full h-screen">
        <ToeicPart7Player
          data={groups}
          isReviewMode={true}
        />
      </div>
    </AdminEditProvider>
  );
}
