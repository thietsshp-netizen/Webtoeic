"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';

const ToeicPart1Player = dynamic(() => import("./ToeicPart1Player"), { ssr: false });
const ToeicPart2Player = dynamic(() => import("./ToeicPart2Player"), { ssr: false });
const ToeicPart34Player = dynamic(() => import("./ToeicPart34Player"), { ssr: false });
const ToeicPart5Player = dynamic(() => import("./ToeicPart5Player"), { ssr: false });
const ToeicPart6Player = dynamic(() => import("./Part6/ToeicPart6Player"), { ssr: false });
const ToeicPart7Player = dynamic(() => import("./Part7/ToeicPart7Player"), { ssr: false });

interface ToeicPlayerClientProps {
  partsData?: { partNumber: number; groups: any[] }[];
  targetPart?: number;
  data?: any[];
  lessonId: string;
  initialProgress: any;
  courseId?: string;
  nextLessonId?: string;
  isReviewMode?: boolean;
  jumpTo?: { id: string; ts: number } | null;
  videoExplanation?: any;
}

export default function ToeicPlayerClient({
  partsData,
  targetPart: initialTargetPart,
  data: initialData,
  lessonId,
  initialProgress,
  courseId,
  nextLessonId,
  isReviewMode = false,
  jumpTo,
  videoExplanation
}: ToeicPlayerClientProps) {
  
  // State for switching parts if it's a full test
  const [activePart, setActivePart] = useState(initialTargetPart || partsData?.[0]?.partNumber || 1);

  // Auto-switch part if jumpTo.id is present in a different part
  const lastJumpedId = useRef<string | null>(null);

  useEffect(() => {
    if (jumpTo?.id && partsData) {
      const targetId = String(jumpTo.id);
      
      // Chỉ nhảy nếu ID này khác với ID vừa nhảy gần nhất
      if (lastJumpedId.current === targetId) return;

      for (const p of partsData) {
        const found = p.groups.some(g => 
          g.questions?.some((q: any) => 
            String(q.id) === targetId || 
            String(q.questionNo) === targetId
          )
        );
        if (found) {
          lastJumpedId.current = targetId;
          if (p.partNumber !== activePart) {
            setActivePart(p.partNumber);
          }
          break;
        }
      }
    }
  }, [jumpTo, partsData]); // Loại bỏ activePart khỏi đây

  const currentPartData = partsData 
    ? partsData.find(p => p.partNumber === activePart)?.groups || []
    : initialData || [];

  const renderPlayer = () => {
    const props = {
      data: currentPartData,
      lessonId,
      initialProgress,
      courseId,
      nextLessonId,
      isReviewMode,
      jumpTo,
      videoExplanation
    };

    switch (activePart) {
      case 1: return <ToeicPart1Player {...props} />;
      case 2: return <ToeicPart2Player {...props} />;
      case 3:
      case 4: return <ToeicPart34Player {...props} />;
      case 5: return <ToeicPart5Player {...props} />;
      case 6: return <ToeicPart6Player {...props} />;
      case 7: return <ToeicPart7Player {...props} />;
      default:
        return <div className="p-8 text-center text-red-500">Giao diện cho Part {activePart} đang được phát triển.</div>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Part Switcher Header (Only if full test) */}
      {partsData && partsData.length > 1 && (
        <div className="bg-white border-b px-6 py-3 flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r pr-4">
            <Layers size={14} className="text-blue-500" /> Chọn Part
          </div>
          <div className="flex gap-2">
            {partsData.map(p => (
              <button
                key={p.partNumber}
                onClick={() => setActivePart(p.partNumber)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border ${activePart === p.partNumber ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'}`}
              >
                PART {p.partNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {renderPlayer()}
      </div>
    </div>
  );
}
