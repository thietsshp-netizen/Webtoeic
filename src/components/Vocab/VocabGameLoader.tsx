import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import VocabGamePlayer from "@/components/Vocab/VocabGamePlayer";

export default async function VocabGameLoader({
  vocabDayId,
}: {
  vocabDayId: string;
}) {
  const vocabDay = await prisma.vocabDay.findUnique({
    where: { id: vocabDayId },
  });

  if (!vocabDay) {
    return (
      <div className="text-center py-10 text-slate-500 bg-slate-50 border border-dashed rounded-3xl">
        Không tìm thấy dữ liệu từ vựng cho bài học này.
      </div>
    );
  }

  const data = JSON.parse(vocabDay.data);
  const session = await getServerSession(authOptions) as any;

  return (
    <VocabGamePlayer
      vocabDayId={vocabDay.id}
      dayNumber={vocabDay.dayNumber}
      title={vocabDay.title}
      data={data}
      userId={session?.user?.id}
    />
  );
}
