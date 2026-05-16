import Link from "next/link";
import { Layers, PlayCircle, Star, Lock, ChevronRight, Settings } from "lucide-react";
import { clsx } from "clsx";

interface CourseCardProps {
  // Enhanced course card with multi-line description support
  course: any;
  isAdmin?: boolean;
  showProgress?: boolean;
  variant?: "compact" | "full";
}

export default function CourseCard({ course, isAdmin, showProgress = true, variant = "full" }: CourseCardProps) {
  const hasPreviews = (course.previewCount || 0) > 0;
  const progressPercent = course.progressPercent || course.progressPct || 0;
  
  // Format title to be consistent
  const formattedTitle = course.title.replace(/CHUYÊN ĐỀ|KHOÁ HỌC/i, (match: string) => 
    match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
  );

  return (
    <div className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 flex flex-col relative">
      <Link href={`/learn/${course.id}`} className="absolute inset-0 z-10"></Link>
      
      {/* Thumbnail Container */}
      <div className="h-52 bg-slate-50 relative overflow-hidden rounded-t-[2.5rem] pointer-events-none">
        {course.coverImage ? (
          <img src={course.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={course.title} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
             <LayoutIcon size={48} className="text-white opacity-20" />
             <span className="absolute font-bold text-white/40 text-xl tracking-normal uppercase italic">CAMPUS PRO</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {!course.isPublic ? (
            <div className="bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
              <Lock size={10} /> Sắp ra mắt
            </div>
          ) : (
            <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[8px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
              <Star size={10} fill="currentColor" /> Đang mở
            </div>
          )}
        </div>

        {isAdmin && (
          <Link href={`/admin/courses/${course.id}/builder`} className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-blue-600 hover:border-blue-600 transition-all z-20 pointer-events-auto">
            <Settings size={16} />
          </Link>
        )}
      </div>

      <div className="p-8 flex-1 flex flex-col">
        {/* Metadata Row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            <span className="flex items-center gap-1.5">
              <Layers size={11} className="text-slate-300" /> {course.totalSections} Chương
            </span>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <span className="flex items-center gap-1.5">
              <PlayCircle size={11} className="text-blue-300" /> {course.totalLessons} Bài học
            </span>
            {hasPreviews && (
              <>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-black">
                  <Star size={11} fill="currentColor" /> {course.previewCount} Free
                </span>
              </>
            )}
          </div>
        </div>

        {/* Title - The Fix for clipping */}
        <h3 className="text-xl font-black text-slate-900 mb-3 uppercase leading-relaxed py-2 pr-10 line-clamp-2 group-hover:text-blue-600 transition-colors">
          <span className="italic pr-2">{formattedTitle}&nbsp;</span>
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-xs font-medium mb-8 line-clamp-4 leading-relaxed italic">
          {course.description || "Chương trình đào tạo tinh gọn, bám sát cấu trúc đề thi TOEIC mới nhất."}
        </p>

        {/* Progress Section */}
        {showProgress && (
          <div className="mt-auto pt-6 border-t border-slate-50">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase mb-2">
              <span>Đã hoàn thành</span>
              <span>{progressPercent}% ({course.completedLessons || 0}/{course.totalLessons})</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className={clsx("flex items-center justify-end", !showProgress && "mt-auto")}>
          <span className="text-blue-600 font-bold text-xs flex items-center group-hover:translate-x-1 transition-transform uppercase tracking-widest pointer-events-none">
            Vào học <ChevronRight size={18} />
          </span>
        </div>
      </div>
    </div>
  );
}

// Fallback Icon for missing cover
function LayoutIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/>
    </svg>
  );
}
