"use client";

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableLessonItem } from './SortableLessonItem';

export default function CourseStructureBuilder() {
  const [lessons, setLessons] = useState([
    { id: '1', title: 'Giới thiệu cấu trúc đề thi TOEIC', type: 'VIDEO' },
    { id: '2', title: 'Chiến thuật làm bài Part 1', type: 'TEXT' },
    { id: '3', title: 'Luyện tập: Part 1 - Photographs (Dễ)', type: 'IFRAME' },
    { id: '4', title: 'Mẹo tránh bẫy Part 2', type: 'TEXT' },
  ]);

  const [saving, setSaving] = useState(false);

  // Cấu hình Sensor để dnd-kit hiểu lúc nào là Drag (Giữ 150ms để tránh lệch khi cuộn trang)
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            delay: 150, 
            tolerance: 5,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLessons((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Mô phỏng Database Update
        setSaving(true);
        setTimeout(() => setSaving(false), 800);
        
        return newOrder;
      });
    }
  }

  return (
    <div className="w-full max-w-2xl bg-white p-6 rounded-xl border shadow-sm">
      <div className="mb-6 flex justify-between items-center border-b pb-4">
         <div>
             <h3 className="text-xl font-bold text-gray-800">Chương 1: Tổng Quan</h3>
             <p className="text-sm text-gray-500 mt-1">
                Kéo và thả để sắp xếp lại trình tự các bài học bên dưới. 
                {saving && <span className="ml-2 text-green-600 animate-pulse text-xs">Đang tự động lưu...</span>}
             </p>
         </div>
         <button className="text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition">
            + Thêm bài học
         </button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={lessons}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <SortableLessonItem key={lesson.id} id={lesson.id} title={lesson.title} type={lesson.type} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="mt-8 pt-4 text-xs text-gray-400 text-center border-t">
        💡 Kéo biểu tượng Grip (⋮⋮) để thay đổi nhanh luồng bài học mà không tốn công nhập ID tay!
      </div>
    </div>
  );
}
