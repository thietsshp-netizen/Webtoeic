import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Video, FileText, Layout } from 'lucide-react';

export function SortableLessonItem({ id, title, type }: { id: string, title: string, type: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm mb-2 ${isDragging ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200'}`}>
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 focus:outline-none p-1">
        <GripVertical size={20} />
      </div>
      
      <div className="flex-shrink-0 text-blue-500">
        {type === 'VIDEO' ? <Video size={18} /> : type === 'IFRAME' ? <Layout size={18} /> : <FileText size={18} />}
      </div>
      
      <div className="flex-1 font-medium text-gray-700">{title}</div>
      
      <div className="flex gap-2">
         <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 cursor-pointer rounded hover:bg-gray-200 transition">Sửa nội dung</span>
      </div>
    </div>
  );
}
