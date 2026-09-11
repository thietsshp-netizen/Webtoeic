export interface FeatureVideoItem {
  id: string;
  order: number;
  fileName: string;
  videoUrl: string;
  title: string;
  subtitle: string;
  badge: string;
  category: string;
  description: string;
  highlights: string[];
  thumbnail?: string;
  color?: string; // blue, emerald, purple, amber, rose
}

export const SUPABASE_STORAGE_BASE =
  "https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/Video_web_function";

// Cấu hình Metadata chi tiết cho từng video tính năng
// Bạn có thể tùy chỉnh tiêu đề, mô tả, badge, highlights bất kỳ lúc nào tại đây!
export const FEATURE_VIDEOS_METADATA: Record<number, Partial<FeatureVideoItem>> = {
  1: {
    fileName: "1_Chuc_nang_tu_dien_choi gam.mp4",
    title: "Chức năng Từ điển thông minh, Gắn sao & Học chơi Game",
    subtitle: "Tra cứu 1-chạm & 4 chế độ Mini-Game luyện trí nhớ đỉnh cao",
    badge: "TƯƠNG TÁC ĐỘT PHÁ",
    category: "TỪ ĐIỂN & FLASHCARD",
    description:
      "Tích hợp từ điển đa ngữ cảnh Anh-Mỹ / Anh-Anh phát âm tức thì dưới 50ms. Gắn sao lưu từ vựng chỉ với 1 click và tự động chuyển hóa thành 4 mini-game rèn luyện trí nhớ: Flashcard lật thẻ, Scramble ghép chữ, Fill điền khuyết, Match nối từ và Synonym chọn từ đồng nghĩa.",
    highlights: [
      "Tra từ điển tức thì không cần thoát màn hình bài làm",
      "Phát âm chuẩn xác US/UK chuẩn phòng thu với độ trễ 0ms",
      "Gắn sao phân loại theo Deck/Bộ thẻ thông minh",
      "4 Mini-Game tương tác kích thích phản xạ nhớ từ vựng sâu",
    ],
    thumbnail: `${SUPABASE_STORAGE_BASE}/video-thumb-1.jpg`,
    color: "blue",
  },
  2: {
    fileName: "2_Nghe_tung_cau.mp4",
    title: "Chức năng Nghe từng câu & Luyện đoạn chứa Keywords",
    subtitle: "Luyện nghe bắt âm chính xác, bắt trúng từ khóa ăn điểm Part 1 - 4",
    badge: "BÍ QUYẾT LISTENING",
    category: "LUYỆN NGHE CHUYÊN SÂU",
    description:
      "Công cụ chia nhỏ từng câu thoại audio giúp học viên luyện nghe lặp đoạn (A-B loop), nghe chậm tốc độ và tập trung tối đa vào các đoạn chứa từ khóa quan trọng quyết định đáp án đúng của đề thi.",
    highlights: [
      "Phân tách audio từng câu chuẩn xác từng mili-giây",
      "Tua lặp từng đoạn chứa Keywords trọng tâm của bài thi",
      "Tùy chỉnh tốc độ nghe 0.75x - 1.25x linh hoạt",
      "Hiển thị phụ đề song ngữ và phân tích bẫy nghe thường gặp",
    ],
    thumbnail: `${SUPABASE_STORAGE_BASE}/video-thumb-2.jpg`,
    color: "emerald",
  },
  3: {
    fileName: "3_Thong_ke_dang_bai_hay_sai.mp4",
    title: "Tính năng Thống kê dạng bài hay sai",
    subtitle: "Báo cáo lỗi sai chi tiết, định vị chính xác lỗ hổng kiến thức",
    badge: "PHÂN TÍCH THÔNG MINH",
    category: "BÁO CÁO THỰC CHIẾN",
    description:
      "Hệ thống tự động phân loại mọi câu hỏi bạn làm sai theo từng chủ điểm ngữ pháp, dạng bẫy từ vựng hoặc kỹ năng nghe để định vị chính xác điểm yếu và đề xuất lộ trình củng cố thần tốc.",
    highlights: [
      "Biểu đồ phân tích tỉ lệ đúng/sai theo từng Part chi tiết",
      "Thống kê các dạng câu hỏi hay mắc bẫy nhất",
      "Đề xuất bộ đề và bài tập củng cố đúng trọng tâm",
      "Theo dõi sự tiến bộ rõ rệt qua từng ngày học",
    ],
    thumbnail: `${SUPABASE_STORAGE_BASE}/video-thumb-3.jpg`,
    color: "purple",
  },
  4: {
    fileName: "4_Hay_sai_cau_tu_vung_thi_phai_xem_web_nay.mp4",
    title: "Hay sai các câu từ vựng - Nhất định phải thử website này",
    subtitle: "Giải pháp đột phá chinh phục câu hỏi từ vựng khó Part 5 & 6",
    badge: "CHIẾN THUẬT PART 5 & 6",
    category: "TỪ VỰNG ĂN ĐIỂM",
    description:
      "Tổng hợp các bộ từ gia đình (Word Families), cụm Collocations và các cặp từ dễ gây nhầm lẫn thường xuyên xuất hiện trong đề thi TOEIC mới nhất kèm phân tích ngữ cảnh và mẹo nhận diện đáp án trong 5 giây.",
    highlights: [
      "Bộ câu hỏi từ vựng bẫy thực chiến sát đề thi thật 2026",
      "Phân tích họ từ (Word Families) và cụm Collocations chuẩn",
      "Mẹo nhận diện nhanh đáp án đúng trong 5 giây",
      "Thuật toán lặp lại ngắt quãng (SRS) giúp nhớ từ vựng vĩnh viễn",
    ],
    thumbnail: `${SUPABASE_STORAGE_BASE}/video-thumb-4.jpg`,
    color: "amber",
  },
};

/**
 * Trợ giúp trích xuất số thứ tự từ tên file:
 * Ví dụ: "1-chuc-nang-tu-dien.mp4" -> 1
 *        "02 - Nghe tu khoa.mp4" -> 2
 */
export function extractOrderFromFileName(fileName: string, fallbackIndex: number): number {
  const match = fileName.match(/(?:^|[^\d])(\d+)(?:[^\d]|$)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) return num;
  }
  return fallbackIndex + 1;
}

/**
 * Format tên file thành Tiêu đề mặc định nếu chưa cấu hình metadata
 */
export function formatFileNameToTitle(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "") // bỏ đuôi .mp4
    .replace(/^[\d\s-_]+/, "") // bỏ số thứ tự đầu
    .replace(/[-_]+/g, " ") // thay - _ bằng khoảng trắng
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
}

/**
 * Lấy metadata cho video theo thứ tự hoặc tên file
 */
export function getFeatureVideoMeta(order: number, fileName: string): Partial<FeatureVideoItem> {
  if (FEATURE_VIDEOS_METADATA[order]) {
    return FEATURE_VIDEOS_METADATA[order];
  }

  // Fallback tự động cho các video mới upload thêm (5, 6, 7...)
  return {
    title: formatFileNameToTitle(fileName) || `Tính năng đặc biệt số ${order}`,
    subtitle: "Khám phá công cụ hỗ trợ luyện thi TOEIC đột phá",
    badge: "TÍNH NĂNG MỚI",
    category: "TÍNH NĂNG ĐẶC BIỆT",
    description:
      "Công cụ hỗ trợ học tập trực quan giúp học viên nâng cao hiệu quả ôn luyện, nắm vững phương pháp giải đề và tối ưu thời gian học tập.",
    highlights: [
      "Giao diện trực quan, dễ thao tác và trải nghiệm",
      "Tối ưu hóa quy trình luyện đề thực chiến",
      "Hỗ trợ trên mọi thiết bị máy tính, máy tính bảng và điện thoại",
    ],
    color: "blue",
  };
}

/**
 * Danh sách video mặc định dự phòng chuẩn xác (đảm bảo luôn có video URL thật)
 */
export function getDefaultFeatureVideos(): FeatureVideoItem[] {
  return Object.entries(FEATURE_VIDEOS_METADATA).map(([key, meta]) => {
    const order = parseInt(key, 10);
    const fileName = meta.fileName || `${order}_video.mp4`;
    const publicUrl = `${SUPABASE_STORAGE_BASE}/${encodeURIComponent(fileName)}`;

    return {
      id: `default-video-${order}`,
      order: order,
      fileName: fileName,
      videoUrl: publicUrl,
      title: meta.title || `Tính năng số ${order}`,
      subtitle: meta.subtitle || "",
      badge: meta.badge || `TÍNH NĂNG ${order}`,
      category: meta.category || "TÍNH NĂNG",
      description: meta.description || "",
      highlights: meta.highlights || [],
      thumbnail: meta.thumbnail,
      color: meta.color || "blue",
    };
  });
}
