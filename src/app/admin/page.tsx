import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Tổng quan hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">CMS (Bài giảng tĩnh)</h2>
          <p className="text-gray-500 mb-4">Quản lý các khóa học, nhúng iFrame, lý thuyết dạng chữ.</p>
          <Link href="/admin/courses" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Trình quản lý CMS
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">Ngân hàng TOEIC</h2>
          <p className="text-gray-500 mb-4">Soạn thảo các bộ Test thực tế. Gồm 7 phần từ Nghe đến Đọc.</p>
          <Link href="/admin/toeic-tests" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Trình tạo TOEIC Test
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition">
          <h2 className="text-xl font-semibold mb-2">Quản trị Học viên</h2>
          <p className="text-gray-500 mb-4">Tra cứu tiến độ học viên, cấp quyền truy cập, danh sách IP.</p>
          <Link href="/admin/enrollments" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            User Matrix
          </Link>
        </div>
      </div>
    </div>
  );
}
