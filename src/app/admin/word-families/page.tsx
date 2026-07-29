"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Loader2, X, AlertCircle } from "lucide-react";
import { showToast } from "@/components/UI/Toast";

interface WordFamily {
  id: string;
  key: string;
  part: number;
  words: string[];
  originalValue: string;
  createdAt: string;
}

export default function WordFamiliesAdmin() {
  const [families, setFamilies] = useState<WordFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activePart, setActivePart] = useState<1 | 5>(5);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Form states
  const [key, setKey] = useState("");
  const [part, setPart] = useState<number>(5);
  const [wordsInput, setWordsInput] = useState("");
  const [originalValue, setOriginalValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchFamilies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/word-families?part=${activePart}`);
      const data = await res.json();
      if (data.success) {
        setFamilies(data.data);
      } else {
        showToast(data.error || "Không thể tải danh sách từ vựng", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi mạng", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, [activePart]);

  const handleOpenCreate = () => {
    setModalType("create");
    setSelectedId(null);
    setKey("");
    setPart(activePart);
    setWordsInput("");
    setOriginalValue("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fam: WordFamily) => {
    setModalType("edit");
    setSelectedId(fam.id);
    setKey(fam.key);
    setPart(fam.part);
    setWordsInput(fam.words.join(", "));
    setOriginalValue(fam.originalValue);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !wordsInput.trim() || !originalValue.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ các trường.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      key: key.trim(),
      part,
      words: wordsInput.split(",").map((w) => w.trim()).filter(Boolean),
      originalValue: originalValue.trim(),
    };

    try {
      if (modalType === "create") {
        const res = await fetch("/api/word-families", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Đã thêm nhóm từ mới thành công!", "success");
          setIsModalOpen(false);
          fetchFamilies();
        } else {
          setErrorMsg(data.error || "Lỗi khi lưu dữ liệu");
        }
      } else {
        const original = families.find(f => f.id === selectedId);
        if (original) {
          let hasChange = false;
          if (original.key !== payload.key) {
            await updateField("key", payload.key);
            hasChange = true;
          }
          if (original.part !== payload.part) {
            await updateField("part", payload.part);
            hasChange = true;
          }
          const wordsJoined = original.words.join(",");
          const payloadWordsJoined = payload.words.join(",");
          if (wordsJoined !== payloadWordsJoined) {
            await updateField("words", payload.words);
            hasChange = true;
          }
          if (original.originalValue !== payload.originalValue) {
            await updateField("originalValue", payload.originalValue);
            hasChange = true;
          }
          
          showToast("Cập nhật nhóm từ thành công!", "success");
          setIsModalOpen(false);
          fetchFamilies();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối server");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = async (field: string, value: any) => {
    const res = await fetch("/api/admin/update-content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "wordFamily",
        id: selectedId,
        field,
        value,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || `Lỗi cập nhật trường ${field}`);
    }
  };

  const handleDelete = async (id: string, keyStr: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhóm từ "${keyStr}" không?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/word-families/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Đã xóa nhóm từ vựng!", "success");
        fetchFamilies();
      } else {
        showToast(data.error || "Không thể xóa", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi kết nối", "error");
    }
  };

  const filteredFamilies = families.filter((fam) => {
    const search = searchTerm.toLowerCase();
    return (
      fam.key.toLowerCase().includes(search) ||
      fam.originalValue.toLowerCase().includes(search) ||
      fam.words.some((w) => w.toLowerCase().includes(search))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            ☁️ Quản lý Đám mây từ
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý và cập nhật cơ sở dữ liệu các nhóm từ vựng của Đám mây từ & Sổ tay ngữ pháp
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-100 transition duration-150 active:scale-95 text-sm"
        >
          <Plus size={18} />
          Thêm nhóm từ mới
        </button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActivePart(5)}
          className={`px-5 py-2.5 font-bold text-sm border-b-2 transition duration-150 ${activePart === 5 ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          📚 Part 5 & Grammar Handbook
        </button>
        <button
          onClick={() => setActivePart(1)}
          className={`px-5 py-2.5 font-bold text-sm border-b-2 transition duration-150 ${activePart === 1 ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          🖼️ Part 1 (Ảnh mô tả)
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6 flex items-center gap-3">
        <Search className="text-slate-400 shrink-0" size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm theo nhóm từ, nghĩa tiếng Việt, hoặc từ vựng..."
          className="w-full text-slate-700 placeholder-slate-400 outline-none font-medium text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-md"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* DATA GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-purple-600 mb-3" size={40} />
          <span className="text-slate-500 font-bold text-sm">Đang tải danh sách từ vựng từ database...</span>
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <AlertCircle className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">Không tìm thấy nhóm từ vựng nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6 w-1/4">Nhóm từ (Key)</th>
                  <th className="py-4 px-6 w-1/3">Từ vựng thuộc nhóm</th>
                  <th className="py-4 px-6">Nghĩa & Chi tiết</th>
                  <th className="py-4 px-6 w-32 text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredFamilies.map((fam) => (
                  <tr key={fam.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="py-4 px-6 font-bold text-slate-800 break-words align-top">
                      {fam.key}
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {fam.words.map((word, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-md"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 break-words whitespace-pre-wrap font-medium align-top leading-relaxed">
                      {fam.originalValue}
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(fam)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(fam.id, fam.key)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa bỏ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 font-semibold flex justify-between items-center">
            <span>Hiển thị {filteredFamilies.length} / {families.length} nhóm từ</span>
            <span>Cập nhật Live Database</span>
          </div>
        </div>
      )}

      {/* CREATE & EDIT DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => !isSaving && setIsModalOpen(false)}
          />
          
          <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-purple-100 p-6 w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {modalType === "create" ? "✨ Thêm nhóm từ mới" : "📝 Sửa nhóm từ vựng"}
              </h3>
              <button
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSave} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex gap-2 items-center">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nhóm từ (Key)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Candidate, applicant, job-seeker (n)"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-medium text-sm transition"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Thuộc về Part
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-medium text-sm transition bg-white"
                  value={part}
                  onChange={(e) => setPart(Number(e.target.value))}
                  disabled={isSaving}
                >
                  <option value={5}>📚 Part 5 & Grammar Handbook</option>
                  <option value={1}>🖼️ Part 1 (Ảnh mô tả)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Danh sách từ vựng trong nhóm (Phân tách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: candidate, applicant, job-seeker, interviewee"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-medium text-sm transition"
                  value={wordsInput}
                  onChange={(e) => setWordsInput(e.target.value)}
                  disabled={isSaving}
                />
                <span className="text-[10px] text-slate-400 italic mt-1 block">
                  * Các từ này sẽ được dùng để tự động quét & gạch chân, hiển thị biểu tượng đám mây trong bài đọc.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nghĩa & Giải thích chi tiết
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Ví dụ:&#10;ứng viên xin việc&#10;= Candidate, applicant, job-seeker (n)"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-medium text-sm transition"
                  value={originalValue}
                  onChange={(e) => setOriginalValue(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-100 transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu dữ liệu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
