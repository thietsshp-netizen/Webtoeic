"use client";

import { useEffect, useState } from "react";
import { Laptop, Tablet, Smartphone, Trash2, ShieldAlert, Clock, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

interface Device {
  id: string;
  deviceId: string;
  type: string;
  model: string;
  createdAt: string;
}

export default function DeviceManagement() {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/me/devices");
      const data = await res.json();
      if (data.success) {
        setDevices(data.devices);
      }
    } catch (e) {
      console.error("Lỗi lấy danh sách thiết bị:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (deviceId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) return;
    
    try {
      const res = await fetch(`/api/me/devices/${deviceId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã xóa thiết bị thành công");
        fetchDevices();
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  if (loading) return <div className="animate-pulse h-40 bg-slate-50 rounded-[2rem]"></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
          <div className="w-12 h-1 bg-amber-500 rounded-full" /> Thiết bị của tôi
        </h3>

        {/* Policy Box */}
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 mb-10 flex gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Chính sách bảo mật thiết bị</h4>
            <ul className="text-xs text-amber-700 font-medium space-y-1.5 list-disc pl-4">
               <li>Mỗi tài khoản được dùng tối đa <b>1 Máy tính/Laptop</b> và <b>1 Điện thoại/Máy tính bảng</b>.</li>
              <li><b>Không được phép</b> học đồng thời trên 2 thiết bị cùng lúc.</li>
              <li>Bạn được quyền tự đổi thiết bị trong <b>30 ngày đầu tiên</b> kể từ lúc tạo tài khoản.</li>
              <li>Sau 30 ngày, thiết bị sẽ bị <b>khóa cố định</b>. Mọi yêu cầu đổi máy sau đó vui lòng liên hệ Admin.</li>
            </ul>
          </div>
        </div>

        {/* Devices List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devices.map((device) => {
            const registeredDate = new Date(device.createdAt);
            const userCreatedAt = session?.user?.createdAt ? new Date(session.user.createdAt as any) : registeredDate;
            const diffDays = Math.floor((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
            const canReset = diffDays < 30;

            return (
              <div key={device.id} className="relative group bg-slate-50 border border-slate-100 p-6 rounded-[2rem] hover:bg-white hover:border-blue-200 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${device.type === 'PC' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {device.type === 'PC' ? <Laptop size={28} /> : <Smartphone size={28} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{device.type === 'PC' ? 'Máy tính / Laptop' : 'Điện thoại / Tablet'}</div>
                    <div className="text-sm font-bold text-slate-800">{device.model || (device.type === 'PC' ? 'PC/Laptop' : 'Mobile Device')}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <Clock size={12} /> Đăng ký: {registeredDate.toLocaleDateString('vi-VN')}
                      </div>
                      {canReset ? (
                        <div className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                          <Info size={12} /> Còn {30 - diffDays} ngày đổi
                        </div>
                      ) : (
                        <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                          <ShieldAlert size={12} /> Đã khóa cố định
                        </div>
                      )}
                    </div>
                  </div>

                  {canReset && (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleDelete(device.deviceId)}
                        className="p-3 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl border border-slate-100 shadow-sm transition-all"
                        title="Xóa thiết bị này để đổi máy mới"
                      >
                        <Trash2 size={18} />
                      </button>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Xóa để đổi</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {devices.length === 0 && (
            <div className="md:col-span-2 py-10 text-center text-slate-400 font-bold italic text-sm">
              Bạn chưa đăng ký thiết bị nào.
            </div>
          )}
        </div>

        {/* Instructions */}
        {devices.length > 0 && (
          <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
              <Info size={20} />
            </div>
            <div className="text-xs text-slate-500 leading-relaxed">
              <p className="font-bold text-slate-700 mb-1">Cách đổi thiết bị mới:</p>
              Nếu bạn muốn đổi sang máy khác, hãy nhấn nút <b>"Xóa để đổi"</b> ở thiết bị hiện tại. Sau đó, chỉ cần dùng máy mới đăng nhập vào hệ thống bằng đúng tài khoản này <b>({session?.user?.email})</b>, máy mới sẽ tự động được đăng ký.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
