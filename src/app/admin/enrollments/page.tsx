"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Circle, Search, RefreshCw, Users,
  BookOpen, ShieldAlert, Loader2, Trash2, Filter, ArrowUpDown, UserPlus, X, Mail, Key, Settings, Laptop, Smartphone
} from "lucide-react";
import { clsx } from "clsx";

// --- Types ---
type Course = { id: string; title: string };
type Student = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  lastIp: string;
  enrollments: string[];
  createdAt: string; 
  accountExpiresAt: string | null;
};
type MatrixData = { users: Student[]; courses: Course[] };

export default function EnrollmentMatrix() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null); // "userId_courseId"
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  
  // New States for filters, sorting, and bulk actions
  const [filterType, setFilterType] = useState("ALL"); // ALL | ENROLLED | UNENROLLED
  const [sortOrder, setSortOrder] = useState("NEWEST"); // NEWEST | OLDEST
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Create User Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: "", email: "", password: "", days: "", role: "USER" });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Device Management Modal States
  const [showDeviceModal, setShowDeviceModal] = useState<{ userId: string; name: string } | null>(null);
  const [userDevices, setUserDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Chuyển hướng nếu không phải Admin
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated" && !isAdmin) router.push("/");
  }, [status, isAdmin, router]);

  // Fetch dữ liệu thật từ API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/enrollments");
      if (!res.ok) throw new Error("Lỗi tải dữ liệu");
      const json = await res.json();
      setData(json);
      setSelectedUsers(new Set()); // Reset selections on fetch
    } catch (e) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchData();
    }
  }, [status, isAdmin, fetchData]);

  // Toggle enrollment "một chạm"
  const toggleAccess = async (userId: string, courseId: string) => {
    const key = `${userId}_${courseId}`;
    if (toggling) return; // Chặn double-click
    setToggling(key);

    // Optimistic UI — cập nhật ngay lập tức
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          const enrolled = u.enrollments.includes(courseId);
          return {
            ...u,
            enrollments: enrolled
              ? u.enrollments.filter(id => id !== courseId)
              : [...u.enrollments, courseId],
          };
        }),
      };
    });

    try {
      const res = await fetch("/api/admin/enrollments/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId }),
      });
      if (!res.ok) throw new Error("Lỗi server");
    } catch {
      // Rollback nếu lỗi
      fetchData();
    } finally {
      setToggling(null);
    }
  };
  
  const updateExpiration = async (userId: string, newDate: string) => {
    try {
      const res = await fetch("/api/admin/users/update-expiration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, days: newDate === "" ? "" : newDate }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Lỗi cập nhật");
      
      // Cập nhật state cục bộ với dữ liệu mới nhất từ server (nếu có)
      if (result.user) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.map(u => u.id === userId ? { ...u, accountExpiresAt: result.user.accountExpiresAt } : u)
          };
        });
      }
    } catch (e: any) {
      alert(`⚠️ Lỗi: ${e.message}`);
      fetchData(); // Tải lại dữ liệu để đảm bảo UI khớp với DB
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`Bạn chắc chắn muốn xóa ${selectedUsers.size} học viên đã chọn? Dữ liệu khóa học và tiến độ của họ cũng sẽ bị xóa.`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedUsers) })
      });
      if (!res.ok) throw new Error("Lỗi xóa");
      
      const result = await res.json();
      if (result.deletedCount === 0) {
        alert("⚠️ Không có học viên nào bị xóa (có thể do sai ID hoặc vai trò không phải USER).");
      } else {
        alert(`✅ Đã xóa thành công ${result.deletedCount} học viên.`);
      }
      
      fetchData();
    } catch (e) {
      alert("Lỗi khi xóa học viên. Vui lòng thử lại!");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });
  };

  const toggleSelectAll = (userIds: string[]) => {
    if (selectedUsers.size === userIds.length && userIds.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(userIds));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Lỗi tạo tài khoản");
      
      setShowAddModal(false);
      setNewUserData({ name: "", email: "", password: "", days: "", role: "USER" });
      fetchData(); // Refresh list realtime
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setIsCreating(false);
    }
  };

  const fetchUserDevices = async (userId: string, name: string) => {
    setShowDeviceModal({ userId, name });
    setLoadingDevices(true);
    try {
      const res = await fetch(`/api/admin/users/devices/${userId}`);
      const json = await res.json();
      if (json.success) setUserDevices(json.devices);
    } catch (e) {
      console.error("Lỗi lấy thiết bị:", e);
    } finally {
      setLoadingDevices(false);
    }
  };

  const resetDevice = async (userId: string, deviceId: string) => {
    if (!confirm("Bạn muốn reset (xóa) thiết bị này cho học viên?")) return;
    try {
      const res = await fetch(`/api/admin/users/devices/${userId}?deviceId=${deviceId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setUserDevices(prev => prev.filter(d => d.deviceId !== deviceId));
      }
    } catch (e) {
      alert("Lỗi khi reset thiết bị");
    }
  };

  const toggleRole = async (userId: string, newRole: string) => {
    if (!confirm(`Bạn muốn đổi quyền tài khoản này thành ${newRole}?`)) return;
    
    try {
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Lỗi cập nhật");
      
      alert("✅ Cập nhật quyền thành công!");
      fetchData();
    } catch (e: any) {
      alert(`⚠️ Lỗi: ${e.message}`);
    }
  };

  // Áp dụng filters và sắp xếp
  let filteredStudents = data?.users || [];

  if (filterType === "ENROLLED") {
    filteredStudents = filteredStudents.filter(u => u.enrollments.length > 0);
  } else if (filterType === "UNENROLLED") {
    filteredStudents = filteredStudents.filter(u => u.enrollments.length === 0);
  }

  if (search) {
    filteredStudents = filteredStudents.filter(
      s =>
        (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.name ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }

  filteredStudents.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return sortOrder === "NEWEST" ? dateB - dateA : dateA - dateB;
  });

  // ---- Loading / Error states ----
  if (status === "loading" || (loading && !data)) {
    return (
      <div className="flex items-center justify-center h-96 gap-3 text-slate-400">
        <Loader2 className="animate-spin" size={28} />
        <span className="font-bold text-sm uppercase tracking-widest">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto mt-20 text-center">
        <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
        <p className="text-slate-600 font-bold mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Users size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Quản lý Học viên & Cấp quyền
            </h1>
          </div>
          <p className="text-slate-400 font-medium text-sm ml-13">
            {data?.users.length ?? 0} học viên · {data?.courses.length ?? 0} khóa học · Bấm ô để cấp/thu hồi quyền tức thì
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action Add User */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            <UserPlus size={18} />
            Thêm học viên mới
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

          {/* Action Delete */}
          {selectedUsers.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Xóa {selectedUsers.size} Học viên
            </button>
          )}

          {/* Filters */}
          <div className="relative group">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              title="Lọc Trạng thái"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="pl-9 pr-6 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none bg-white hover:bg-slate-50 cursor-pointer"
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="ENROLLED">Đã cấp khóa học</option>
              <option value="UNENROLLED">Chưa cấp khóa học</option>
            </select>
          </div>

          {/* Sort */}
          <div className="relative group">
            <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              title="Sắp xếp Ngày đăng ký"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="pl-9 pr-6 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none bg-white hover:bg-slate-50 cursor-pointer"
            >
              <option value="NEWEST">Mới nhất (Mặc định)</option>
              <option value="OLDEST">Cũ nhất</option>
            </select>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Tìm email hoặc tên..."
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl w-48 lg:w-64 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-400 hover:text-slate-700"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-2xl p-5">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Tổng học viên</p>
          <p className="text-3xl font-black text-blue-600">{data?.users.length ?? 0}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-5">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Tổng khóa học</p>
          <p className="text-3xl font-black text-emerald-600">{data?.courses.length ?? 0}</p>
        </div>
        <div className="bg-violet-50 rounded-2xl p-5">
          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Tổng phân quyền</p>
          <p className="text-3xl font-black text-violet-600">
            {data?.users.reduce((acc, u) => acc + u.enrollments.length, 0) ?? 0}
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs">
                <th className="p-4 font-black w-72 border-r border-slate-100 sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_#f1f5f9]">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size > 0 && selectedUsers.size === filteredStudents.length}
                      onChange={() => toggleSelectAll(filteredStudents.map(s => s.id))}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      title="Chọn tất cả"
                    />
                    <div className="flex items-center gap-2 uppercase tracking-widest">
                       <Users size={14} /> HỌC VIÊN
                    </div>
                  </div>
                </th>
                {data?.courses.map(c => (
                  <th
                    key={c.id}
                    className="p-4 font-black text-center min-w-[140px] border-r border-slate-100 last:border-r-0 uppercase tracking-wider"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <BookOpen size={14} className="text-blue-400" />
                      <span className="truncate max-w-[120px] block" title={c.title}>
                        {c.title}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, i) => (
                <tr
                  key={student.id}
                  className={`border-b border-slate-100 last:border-b-0 hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                >
                  {/* Student Info */}
                  <td className="p-4 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(student.id)}
                        onChange={() => toggleSelectUser(student.id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {(student.name || student.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-black text-slate-800 text-sm leading-tight truncate">
                          {student.name || "Chưa đặt tên"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate">{student.email}</div>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                              Đăng ký: {new Date(student.createdAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                              })}
                            </div>
                            <button
                              onClick={() => router.push(`/admin/enrollments/${student.id}`)}
                              className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold whitespace-nowrap hover:bg-emerald-100 transition-colors"
                            >
                              Xem tiến độ
                            </button>
                            <button
                              onClick={() => fetchUserDevices(student.id, student.name || student.email || "")}
                              className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-bold whitespace-nowrap hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                              <Laptop size={10} /> Thiết bị
                            </button>
                            <div className="relative inline-block">
                              <select
                                value={student.role}
                                onChange={(e) => toggleRole(student.id, e.target.value)}
                                disabled={student.email === session?.user?.email}
                                className={clsx(
                                  "text-[10px] border px-2 py-0.5 rounded font-bold whitespace-nowrap transition-colors outline-none cursor-pointer appearance-none pr-4",
                                  student.role === "ADMIN" 
                                    ? "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100" 
                                    : "text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100",
                                  student.email === session?.user?.email && "opacity-30 cursor-not-allowed"
                                )}
                                title={student.email === session?.user?.email ? "Bạn không thể tự đổi quyền của mình" : "Đổi quyền USER/ADMIN"}
                              >
                                <option value="USER">Học viên</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                <ArrowUpDown size={8} />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SỐ NGÀY PRO:</span>
                            <input 
                              type="number"
                              defaultValue={student.accountExpiresAt ? Math.max(-1, Math.ceil((new Date(student.accountExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : ""}
                              onBlur={(e) => updateExpiration(student.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="w-16 text-[10px] font-bold text-blue-600 border border-slate-200 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                              title="Nhập số ngày (Ví dụ: 365). Bấm Enter để lưu."
                            />
                            {student.accountExpiresAt && (
                              <span className={clsx(
                                "text-[9px] font-black uppercase",
                                new Date(student.accountExpiresAt) > new Date() ? "text-emerald-500" : "text-rose-500"
                              )}>
                                {new Date(student.accountExpiresAt) > new Date() ? "đang hoạt động" : "đã hết hạn"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Enrollment Cells */}
                  {data?.courses.map(course => {
                    const key = `${student.id}_${course.id}`;
                    const enrolled = student.enrollments.includes(course.id);
                    const isTogglingThis = toggling === key;

                    return (
                      <td key={course.id} className="p-4 text-center border-r border-slate-100 last:border-r-0">
                        <button
                          onClick={() => toggleAccess(student.id, course.id)}
                          disabled={!!toggling}
                          className="focus:outline-none hover:scale-110 active:scale-95 transition-transform disabled:opacity-50 mx-auto block"
                          title={enrolled ? "Thu hồi quyền" : "Cấp quyền"}
                        >
                          {isTogglingThis ? (
                            <Loader2 className="w-7 h-7 text-blue-400 animate-spin mx-auto" />
                          ) : enrolled ? (
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto drop-shadow-sm" />
                          ) : (
                            <Circle className="w-8 h-8 text-slate-200 hover:text-slate-300 mx-auto" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={(data?.courses.length ?? 0) + 1}
                    className="p-16 text-center text-slate-400"
                  >
                    <Users size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold">Không tìm thấy học viên nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-xs font-bold text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500" /> Đã cấp quyền
        </div>
        <div className="flex items-center gap-2">
          <Circle size={16} className="text-slate-300" /> Chưa cấp — bấm để cấp
        </div>
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="text-blue-400" /> Đang cập nhật...
        </div>
      </div>

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Tạo tài khoản mới</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-8 pt-4 space-y-5">
              {createError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 italic">
                  ⚠️ {createError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Họ và tên</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Users size={18} /></span>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                    value={newUserData.name}
                    onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Email (Dùng đăng nhập)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Mail size={18} /></span>
                  <input
                    type="email"
                    required
                    placeholder="hocvien@gmail.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                    value={newUserData.email}
                    onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Số ngày Pro (Mặc định 7)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Settings size={18} /></span>
                  <input
                    type="number"
                    placeholder="Ví dụ: 365"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                    value={newUserData.days}
                    onChange={e => setNewUserData({...newUserData, days: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Quyền hạn (Role)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><ShieldAlert size={18} /></span>
                  <select
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                    value={newUserData.role}
                    onChange={e => setNewUserData({...newUserData, role: e.target.value})}
                  >
                    <option value="USER">Học viên (USER)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Mật khẩu khởi tạo</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Key size={18} /></span>
                  <input
                    type="text"
                    required
                    placeholder="Mật khẩu bí mật"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
                    value={newUserData.password}
                    onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">* Hãy gửi email và mật khẩu này cho học viên sau khi tạo thành công.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-4 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  {isCreating ? <Loader2 className="animate-spin" /> : <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />}
                  {isCreating ? "ĐANG TẠO..." : "XÁC NHẬN TẠO TÀI KHOẢN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- DEVICE MODAL --- */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Quản lý thiết bị</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Học viên: {showDeviceModal.name}</p>
              </div>
              <button onClick={() => setShowDeviceModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {loadingDevices ? (
                <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="font-bold text-xs uppercase tracking-widest">Đang tải...</span>
                </div>
              ) : userDevices.length === 0 ? (
                <div className="py-10 text-center text-slate-400 italic font-bold">Chưa có thiết bị nào đăng ký.</div>
              ) : (
                <div className="space-y-4">
                  {userDevices.map(device => (
                    <div key={device.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          device.type === 'PC' ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
                        )}>
                          {device.type === 'PC' ? <Laptop size={24} /> : <Smartphone size={24} />}
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{device.type}</div>
                          <div className="text-sm font-bold text-slate-800">{device.model || "Unknown Device"}</div>
                          <div className="text-[10px] text-slate-400 font-bold">Đăng ký: {new Date(device.createdAt).toLocaleDateString("vi-VN")}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => resetDevice(showDeviceModal.userId, device.deviceId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-500 border border-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                      >
                        <RefreshCw size={12} /> Reset
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-700 font-bold italic leading-relaxed">
                  * Hệ thống giới hạn 1 PC và 1 Mobile. Reset slot giúp học viên có thể đăng nhập trên thiết bị mới nếu họ đã hết lượt đổi máy (quá 30 ngày).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
