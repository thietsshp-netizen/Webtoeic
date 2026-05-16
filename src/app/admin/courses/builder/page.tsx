import CourseStructureBuilder from "@/components/Builder/CourseStructureBuilder";

export default function BuilderPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Course / Test Structure Builder</h1>
        <p className="text-gray-500 mt-2">Dựng cấu trúc khóa học CMS và các bài giảng trong Toeic Test thông minh.</p>
      </div>

      {/* Hiển thị Demo Component Drag and drop */}
      <CourseStructureBuilder />
    </div>
  );
}
