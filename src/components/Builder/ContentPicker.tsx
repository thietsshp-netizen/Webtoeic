"use client";

import { useState } from "react";
import QuillEditor from "../Editor/QuillEditor";
import { Video, Layout, FileText, Lock } from "lucide-react";

export default function ContentPicker() {
  const [activeType, setActiveType] = useState('TEXT');

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm mt-6">
      {/* Tab selection */}
      <div className="flex border-b bg-gray-50 overflow-x-auto">
        <button 
          onClick={() => setActiveType('TEXT')}
          className={`flex-1 min-w-[200px] py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeType === 'TEXT' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FileText size={18} /> Văn bản / Đa phương tiện
        </button>
        <button 
          onClick={() => setActiveType('VIDEO')}
          className={`flex-1 min-w-[200px] py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeType === 'VIDEO' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Video size={18} /> Nhúng Video / Stream
        </button>
        <button 
          onClick={() => setActiveType('IFRAME')}
          className={`flex-1 min-w-[200px] py-3 text-sm font-semibold flex items-center justify-center gap-2 ${activeType === 'IFRAME' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Layout size={18} /> HTML Iframe 
        </button>
      </div>

      {/* Editor Content Box */}
      <div className="p-5 bg-white">
        {activeType === 'TEXT' && (
           <div className="animate-in fade-in zoom-in duration-200">
               <div className="flex items-center gap-2 mb-4 bg-gray-50 border p-3 rounded-lg text-sm text-gray-700">
                 <Lock size={16} className="text-green-600" />
                 <span>Mọi thông tin gõ bên dưới sẽ tự động được <b className="text-gray-900 border-b border-gray-300 border-dashed">mã hóa chuẩn AES-256</b> khi bạn bấm lưu.</span>
               </div>
               
               <QuillEditor />
           </div>
        )}


        {activeType === 'VIDEO' && (
           <div className="animate-in fade-in zoom-in duration-200 space-y-4 max-w-xl">
               <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Đường dẫn Video (Youtube / Vimeo / Bunny CDN)</label>
                  <input type="text" placeholder="https://youtube.com/watch?v=..." className="w-full border-gray-300 border rounded-md p-3 outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400" />
               </div>
               <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                  <p><b>Video Security:</b> Tính năng bảo vệ liên kết Video (Signed URLs) tự động kicks-in dựa theo domain. Học viên sẽ không copy được link.</p>
               </div>
           </div>
        )}

        {activeType === 'IFRAME' && (
           <div className="animate-in fade-in zoom-in duration-200 space-y-4 max-w-xl">
               <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Đường dẫn tĩnh Local (Tới các thư mục Part 1,2,3)</label>
                  <div className="flex shadow-sm rounded-md overflow-hidden">
                     <span className="bg-gray-100 border border-r-0 px-3 py-2 text-gray-500 font-mono text-sm inline-flex items-center">/public/</span>
                     <input type="text" placeholder="Part 1/index.html" className="flex-1 border rounded-none rounded-r-md p-2 outline-none focus:ring-2 focus:ring-blue-100 border-l-0 text-sm" />
                  </div>
               </div>
               <p className="text-xs text-gray-500 mt-2">Dùng tính năng này để chèn cả một ứng dụng riêng biệt (ví dụ code luyện Part 5) dưới dạng module con của khóa học.</p>
           </div>
        )}
      </div>
    </div>
  );
}
