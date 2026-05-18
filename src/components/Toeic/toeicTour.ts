import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// --- CÁC BƯỚC ĐỊNH NGHĨA DÙNG CHUNG CỰC KỲ ĐỒNG BỘ ---

// 1. Bước Chào mừng: Đục sáng target vô hình ở tâm màn hình
const welcomeStep = {
  element: "#toeic-tour-welcome-target",
  popover: {
    title: "👋 Chào mừng bạn đến với hoctoeic!",
    description: "Hệ thống đã tích hợp <strong>bộ công cụ học tập tối tân</strong> giúp bạn tối ưu hóa 100% hiệu suất làm bài và luyện nghe sâu. Hãy cùng khám phá nhanh các tính năng độc quyền trong 30 giây nhé!",
    side: "bottom"
  }
};

// 2. Bước Từ điển nhanh: Tra cứu từ vựng trực tiếp
const dictionaryStep = {
  element: "#question-text", // Sẽ được cập nhật động bằng selector tương ứng với từng Part
  popover: {
    title: "📚 Từ điển nhanh thông minh",
    description: "Gặp từ mới khi làm bài? Chỉ cần <strong>bôi đen bất kỳ từ hoặc cụm từ nào trên màn hình</strong>, cửa sổ giải nghĩa từ điển Anh-Việt trực quan sẽ hiển thị ngay lập tức giúp bạn học từ vựng siêu tốc!",
    side: "top"
  }
};

// 2.1. Bước Lưu từ vựng
const dictionarySaveStep = {
  element: ".tour-dict-star-btn",
  popover: {
    title: "⭐ Lưu từ vựng nhanh",
    description: "Bấm vào đây để gắn sao, flashcard sẽ tự động được tạo và lưu vào Sổ từ vựng của bạn",
    side: "left"
  }
};

// 2.2 Bước Chọn Part & Đặt lại thời gian
const fullTestTimerStep = {
  element: "#full-test-part-timer-target",
  popover: {
    title: "⏱️ Quản lý thời gian & Part",
    description: "Bạn có thể chọn làm theo từng Part lẻ và đặt lại thời gian làm bài tuỳ ý ở đây",
    side: "bottom"
  }
};

// 2.3 Bước Chuyển bài học
const lessonNavStep = {
  element: "#tour-lesson-nav-target",
  popover: {
    title: "⏭️ Chuyển bài học",
    description: "Chuyển qua bài học trước hoặc bài học tiếp theo ở đây nếu không muốn mở khung danh sách bên trái.",
    side: "bottom"
  }
};

// 3. Bước Bảng lộ trình khóa học bên trái
const courseSidebarStep = {
  element: "#learn-course-sidebar",
  popover: {
    title: "🗺️ Lộ trình khóa học bài bản",
    description: "Xem toàn bộ danh sách các đề thi, các sách học, chương mục và theo dõi sát sao tiến độ học tập <strong>Pro</strong> của bạn tại thanh bên trái này. Mặc định thanh sẽ tự động thu nhỏ nếu màn hình không đủ rộng.",
    side: "right"
  }
};

// 4. Bước Nút mở Review Center
const reviewCenterBtnStep = {
  element: "#review-center-toggle-btn",
  popover: {
    title: "🎯 Nút mở Review Center",
    description: "Click vào nút <strong>Cuốn sách này</strong> trên thanh menu bên trái bất kỳ lúc nào để mở bung <strong>Review Center</strong>, xem lại các câu đã gắn cờ/ghi chú.",
    side: "right"
  }
};

// 4.1. Bước Bảng ôn tập Review Center
const reviewCenterPanelStep = {
  element: "#review-center-panel-target",
  popover: {
    title: "📊 Bảng ôn tập thông minh",
    description: "Đây là <strong>Review Center</strong> - nơi tổng hợp toàn bộ các câu hỏi khó mà bạn đã gắn cờ và ghi chú của tất cả các đề thi trong khóa học. Bạn có thể lọc theo màu cờ, tìm kiếm ghi chú và click ghi chú dưới danh sách để nhảy tới câu đó và ôn tập lại cực kỳ hiệu quả!",
    side: "right"
  }
};

// 5. Bước Bảng câu hỏi thông minh bên phải
const sidebarStep = {
  element: ".questions-sidebar-portal",
  popover: {
    title: "🔢 Bảng điều hướng câu hỏi",
    description: "Đây là bảng điều hướng câu hỏi làm bài. Những câu đã/chưa chọn đáp án, gắn cờ... sẽ hiển thị trực quan ở đây. Bạn có thể click vào phím số để nhảy câu nhanh. Mặc định bảng này sẽ thu gọn lại vào bên phải màn hình.",
    side: "left"
  }
};

// 6. Bước Gắn cờ câu hỏi khó để xem lại
const flagStep = {
  element: ".flag-selector-btn",
  popover: {
    title: "🚩 Gắn cờ câu hỏi",
    description: "Gặp câu hỏi khó hoặc phân vân? Hãy click icon <strong>Ngọn Cờ</strong> để gắn cờ theo màu tuỳ ý. Các câu gắn cờ sẽ hiển thị nổi bật trên Bảng câu hỏi để bạn dễ dàng quay lại rà soát trước khi nộp bài.",
    side: "bottom"
  }
};

// 7. Bước Ghi chú từ vựng & ngữ pháp
const noteStep = {
  element: ".note-selector-btn",
  popover: {
    title: "✏️ Ghi chú cá nhân",
    description: "Muốn lưu lại bẫy từ vựng hay cấu trúc ngữ pháp hay? Hãy click icon <strong>Bút chì</strong> để mở khung ghi chú và lưu lại ngay kiến thức bổ ích nhé!",
    side: "bottom"
  }
};

// --- BẢN ĐỒ KỊCH BẢN HƯỚNG DẪN CHO TỪNG PART (1 đến 7) ---
const partTourSteps: Record<number, any[]> = {
  // --- PART 1: HƯỚNG DẪN PHOTO (MÔ TẢ TRANH) ---
  1: [
    welcomeStep,
    dictionaryStep,
    dictionarySaveStep,
    fullTestTimerStep,
    lessonNavStep,
    courseSidebarStep,
    reviewCenterBtnStep,
    reviewCenterPanelStep,
    {
      element: "#play-audio-btn", // Nút Play chính
      popover: {
        title: "🎧 Bật/Tắt Audio nhanh",
        description: "Bấm Play hoặc nhấn phím tắt <strong>`</strong> (dưới phím ESC) để <strong>nghe/dừng</strong> toàn bộ bài nghe.",
        side: "bottom"
      }
    },
    {
      element: "#waveform-audio-container",
      popover: {
        title: "🎵 Luyện nghe lặp đoạn (A-B Loop)",
        description: "Độc quyền! Bạn có thể <strong>kéo chuột (bôi đen) một phân đoạn bất kỳ trên thanh sóng âm</strong> để nghe đi nghe lại riêng phân đoạn đó. Click đúp chuột vào sóng âm để hủy lặp.",
        side: "bottom"
      }
    },
    {
      element: ".tour-question-options-target",
      popover: {
        title: "✏️ Chế độ Chép chính tả",
        description: "Tính năng luyện nghe sâu đỉnh cao! Bật chế độ này để <strong>vừa nghe vừa gõ lại câu thoại</strong>. Hệ thống sẽ tự động chấm và tô màu từng ký tự Đúng/Sai giúp bạn sửa lỗi tức thì.",
        side: "bottom"
      }
    },
    {
      element: ".tour-question-options-target",
      popover: {
        title: "💡 Chế độ Gợi ý",
        description: "Bí kíp cứu cánh khi gặp câu khó! Bật chế độ gợi ý để <strong>hiển thị các ký tự ẩn</strong> của từ cần điền, giúp bạn dễ dàng luyện nghe từ khóa.",
        side: "bottom"
      }
    },
    {
      element: ".part1-option-audio-btn", // Nút loa phương án A, B, C, D
      popover: {
        title: "🔊 Luyện nghe lẻ từng câu",
        description: "Độc quyền! Nhấn phím <strong>1, 2, 3, 4</strong> để nghe audio của từng câu.",
        side: "bottom"
      }
    },
    {
      element: "#reveal-btn", // Nút con mắt hiện giải thích
      popover: {
        title: "👁️ Lời thoại & Dịch nghĩa",
        description: "Sau khi làm bài xong, nhấn <strong>Ctrl + Shift + S</strong> để mở xem Transcript tiếng Anh và giải nghĩa từng câu.",
        side: "bottom"
      }
    },
    sidebarStep,
    flagStep,
    noteStep
  ],

  // --- PART 2: HƯỚNG DẪN HỎI ĐÁP (ẨN ĐỀ) ---
  2: [
    welcomeStep,
    dictionaryStep,
    dictionarySaveStep,
    fullTestTimerStep,
    lessonNavStep,
    courseSidebarStep,
    reviewCenterBtnStep,
    reviewCenterPanelStep,
    {
      element: "#play-audio-btn",
      popover: {
        title: "🎧 Nghe Audio chính",
        description: "Bấm Play hoặc nhấn phím <strong>`</strong> để nghe toàn bộ bài nghe từ đầu đến cuối.",
        side: "bottom"
      }
    },
    {
      element: "#waveform-audio-container",
      popover: {
        title: "🎵 Luyện nghe lặp đoạn (A-B Loop)",
        description: "Độc quyền! Bạn có thể <strong>kéo chuột (bôi đen) một phân đoạn bất kỳ trên thanh sóng âm</strong> để nghe đi nghe lại riêng phân đoạn đó. Click đúp chuột vào sóng âm để hủy lặp.",
        side: "bottom"
      }
    },
    {
      element: ".tour-question-options-target",
      popover: {
        title: "✏️ Chế độ Chép chính tả",
        description: "Tính năng luyện nghe sâu đỉnh cao! Bật chế độ này để <strong>vừa nghe vừa gõ lại câu thoại</strong>. Hệ thống sẽ tự động chấm và tô màu từng ký tự Đúng/Sai giúp bạn sửa lỗi phát âm tức thì.",
        side: "bottom"
      }
    },
    {
      element: ".tour-question-options-target",
      popover: {
        title: "💡 Chế độ Gợi ý",
        description: "Bí kíp cứu cánh khi gặp câu khó! Bật chế độ gợi ý để <strong>hiển thị các ký tự ẩn</strong> của từ cần điền, giúp bạn dễ dàng nghe ra từ khóa và chép chính tả chính xác.",
        side: "bottom"
      }
    },
    {
      element: ".part2-segment-audio-btn", // Nút loa câu hỏi & loa A, B, C
      popover: {
        title: "🔊 Nghe lại câu hỏi & phương án",
        description: "Nhấn phím <strong>1</strong> để nghe riêng câu hỏi, nhấn phím <strong>2, 3, 4</strong> để nghe riêng các phương án trả lời A, B, C tương ứng.",
        side: "bottom"
      }
    },
    {
      element: "#reveal-btn",
      popover: {
        title: "👁️ Bản dịch & Phân tích bẫy",
        description: "Nhấn <strong>Ctrl + Shift + S</strong> để xem transcript, giải nghĩa và các bẫy thường gặp trong câu hỏi này.",
        side: "bottom"
      }
    },
    flagStep,
    noteStep
  ],

  // --- PART 3 & PART 4: HỘI THOẠI & BÀI NÓN NGẮN ---
  3: [
    welcomeStep,
    dictionaryStep,
    dictionarySaveStep,
    fullTestTimerStep,
    lessonNavStep,
    courseSidebarStep,
    reviewCenterBtnStep,
    reviewCenterPanelStep,
    {
      element: "#play-audio-btn",
      popover: {
        title: "🎧 Điều khiển âm thanh",
        description: "Nhấn phím <strong>`</strong> để Play/Pause. Nhấn phím <strong>;</strong> để nhanh chóng tua lại 5 giây trước đó để nghe lại từ khóa.",
        side: "bottom"
      }
    },
    {
      element: "#waveform-audio-container",
      popover: {
        title: "🎵 Luyện nghe lặp đoạn (A-B Loop)",
        description: "Độc quyền! Bạn có thể <strong>kéo chuột (bôi đen) một phân đoạn bất kỳ trên thanh sóng âm</strong> để nghe đi nghe lại riêng phân đoạn đó. Click đúp chuột vào sóng âm để hủy lặp.",
        side: "bottom"
      }
    },
    {
      element: ".play-evidence-btn", // Nút loa nhỏ cạnh 3 câu hỏi
      popover: {
        title: "💡 Audio chứa bằng chứng",
        description: "Nhấn phím <strong>1, 2, 3</strong> để hệ thống tự động trích phát riêng đoạn âm thanh chứa câu trả lời cho câu hỏi 1, 2, 3 tương ứng.",
        side: "bottom"
      }
    },
    {
      element: "#reveal-btn",
      popover: {
        title: "👁️ Lời thoại song ngữ",
        description: "Nhấn <strong>Ctrl + Shift + S</strong> để hiển thị Transcript và dịch nghĩa song ngữ. Khi xem giải thích, di chuột qua từng câu tiếng Anh để xem bản dịch.",
        side: "bottom"
      }
    },
    flagStep,
    noteStep
  ],
  4: [],

  // --- PART 5 & PART 6: ĐIỀN TỪ & NGỮ PHÁP ---
  5: [
    welcomeStep,
    dictionaryStep,
    dictionarySaveStep,
    fullTestTimerStep,
    lessonNavStep,
    courseSidebarStep,
    reviewCenterBtnStep,
    reviewCenterPanelStep,
    {
      element: "#reveal-btn",
      popover: {
        title: "👁️ Xem lời giải chi tiết",
        description: "Click nút <strong>XEM LỜI GIẢI</strong> hoặc nhấn phím tắt <strong>Ctrl + Shift + S</strong> để xem lý do tại sao phương án này Đúng, tại sao các phương án khác Sai cực kỳ tường tận.",
        side: "bottom"
      }
    },
    flagStep,
    noteStep,
    sidebarStep,
    {
      element: "#toeic-navigation-container",
      popover: {
        title: "✍️ Lùi / Tiếp câu hỏi nhanh",
        description: "Lựa chọn đáp án A, B, C, D. Click nút <strong>Lùi / Tiếp</strong> ở chân màn hình hoặc nhấn phím tắt <strong>Mũi tên trái / phải</strong> trên bàn phím để chuyển câu nhanh chóng.",
        side: "top"
      }
    }
  ],
  6: [
    welcomeStep,
    dictionaryStep,
    dictionarySaveStep,
    fullTestTimerStep,
    lessonNavStep,
    courseSidebarStep,
    reviewCenterBtnStep,
    reviewCenterPanelStep,
    {
      element: "#reveal-btn",
      popover: {
        title: "👁️ Xem lời giải chi tiết",
        description: "Click nút <strong>XEM LỜI GIẢI</strong> hoặc nhấn phím tắt <strong>Ctrl + Shift + S</strong> để xem lý do tại sao phương án này Đúng, tại sao các phương án khác Sai cực kỳ tường tận.",
        side: "bottom"
      }
    },
    flagStep,
    noteStep,
    sidebarStep,
    {
      element: "#toeic-navigation-container",
      popover: {
        title: "✍️ Lùi / Tiếp câu hỏi nhanh",
        description: "Lựa chọn đáp án A, B, C, D. Click nút <strong>Lùi / Tiếp</strong> ở chân màn hình hoặc nhấn phím tắt <strong>Mũi tên trái / phải</strong> trên bàn phím để chuyển câu nhanh chóng.",
        side: "top"
      }
    }
  ],

  // --- PART 7: ĐỌC HIỂU ĐỈNH CAO ---
  7: [
    welcomeStep,
    dictionaryStep,
    dictionarySaveStep,
    fullTestTimerStep,
    lessonNavStep,
    courseSidebarStep,
    reviewCenterBtnStep,
    reviewCenterPanelStep,
    {
      element: "#split-view-btn", // Nút chia màn hình
      popover: {
        title: "🪟 Chia đôi màn hình đọc",
        description: "Gặp bài đọc Kép hoặc Ba rất dài? Bấm nút này để chia đoạn văn thành 2 khung trên - dưới độc lập để đối chiếu cực kỳ tiện lợi.",
        side: "bottom"
      }
    },
    {
      element: ".hint-active-lightbulb", // Nút bóng đèn gợi ý
      popover: {
        title: "💡 Bôi màu bằng chứng",
        description: "Bấm Icon bóng đèn ở mỗi câu hỏi để hệ thống tự động bôi màu (Highlight) trực tiếp câu chứa thông tin trả lời trong bài đọc bên trái.",
        side: "bottom"
      }
    },
    {
      element: "#reveal-btn",
      popover: {
        title: "👁️ Xem lời giải chi tiết",
        description: "Click nút <strong>HIỆN LỜI GIẢI</strong> hoặc nhấn phím tắt <strong>Ctrl + Shift + S</strong> để mở xem Lời giải chi tiết cực kỳ tường tận.",
        side: "bottom"
      }
    },
    {
      element: "#toeic-passage-container-target", // Đục sáng toàn bộ bảng tin đọc bên trái
      popover: {
        title: "👁️ Di chuột dịch nghĩa",
        description: "Sau khi nhấn nút <strong>Hiện lời giải</strong>, chỉ cần <strong>Di chuột qua bất kỳ câu nào trong bài đọc</strong> để xem bản dịch tiếng Việt hiển thị mượt mà trôi nổi theo chuột.",
        side: "right"
      }
    },
    flagStep,
    noteStep,
    sidebarStep
  ]
};

// Đồng bộ Part 4 giống Part 3
partTourSteps[4] = partTourSteps[3];

// --- HÀM LẤY SELECTOR DỰA TRÊN TỪNG PART ĐỂ CHỈ TRỰC TIẾP VÀO VĂN BẢN HỌC ---
const getDictionarySelector = (part: number): string => {
  if (typeof document === "undefined") return "#toeic-tour-welcome-target";

  switch (part) {
    case 5:
      if (document.querySelector("#question-text")) return "#question-text";
      if (document.querySelector(".question-card")) return ".question-card";
      return "#toeic-tour-welcome-target";
    case 6:
    case 7:
      if (document.querySelector(".passage-container")) return ".passage-container";
      if (document.querySelector(".question-card")) return ".question-card";
      return "#toeic-tour-welcome-target";
    default:
      // Các Part nghe (1, 2, 3, 4) không có bài đọc chữ trực quan lúc học ➔ Fallback đục Stage tâm màn hình
      return "#toeic-tour-welcome-target";
  }
};

// --- 1. TIÊM CSS TÙY CHỈNH THEME PREMIUM TỐI THƯỢNG CHO POPUP ---
const injectDriverTheme = () => {
  if (typeof document === "undefined" || document.getElementById("driverjs-premium-theme")) return;

  const style = document.createElement("style");
  style.id = "driverjs-premium-theme";
  style.innerHTML = `
    /* Giao diện Popover Glassmorphism tuyệt đẹp */
    .driver-popover.driverjs-theme {
      background: rgba(15, 23, 42, 0.85) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 24px !important;
      padding: 24px !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
      color: #f8fafc !important;
      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      max-width: 380px !important;
    }

    /* Arrow mũi tên chỉ đường */
    .driver-popover.driverjs-theme .driver-popover-arrow {
      border-color: rgba(15, 23, 42, 0.85) !important;
    }

    /* Tiêu đề Popover nổi bật */
    .driver-popover.driverjs-theme .driver-popover-title {
      font-size: 18px !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      margin-bottom: 8px !important;
      letter-spacing: -0.025em !important;
      line-height: 1.3 !important;
    }

    /* Nội dung Mô tả chữ trắng xám tương phản cao */
    .driver-popover.driverjs-theme .driver-popover-description {
      font-size: 13.5px !important;
      font-weight: 500 !important;
      color: #cbd5e1 !important;
      line-height: 1.6 !important;
      margin-bottom: 20px !important;
    }

    /* Tô sáng các chữ quan trọng bên trong popover */
    .driver-popover.driverjs-theme .driver-popover-description strong {
      color: #38bdf8 !important;
      font-weight: 800 !important;
    }

    /* Nút bấm chung */
    .driver-popover.driverjs-theme button {
      font-size: 12px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      padding: 8px 16px !important;
      border-radius: 12px !important;
      transition: all 0.2s ease !important;
      cursor: pointer !important;
    }

    /* Nút Tiếp theo / Hoàn tất - Gradient Indigo */
    .driver-popover.driverjs-theme .driver-popover-next-btn {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
    }
    .driver-popover.driverjs-theme .driver-popover-next-btn:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4) !important;
    }

    /* Nút Lùi lại - Mờ xám */
    .driver-popover.driverjs-theme .driver-popover-prev-btn {
      background-color: rgba(255, 255, 255, 0.05) !important;
      color: #94a3b8 !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }
    .driver-popover.driverjs-theme .driver-popover-prev-btn:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
      color: #ffffff !important;
    }

    /* Nút Close (dấu X) */
    .driver-popover.driverjs-theme .driver-popover-close-btn {
      color: #94a3b8 !important;
      transition: color 0.2s !important;
    }
    .driver-popover.driverjs-theme .driver-popover-close-btn:hover {
      color: #ffffff !important;
    }

    /* Khung từ điển thật luôn hiển thị phía trên overlay hướng dẫn, NGOẠI TRỪ bước gắn sao */
    body:not(.driver-dict-save-step) .dictionary-popup-container {
      z-index: 999999 !important;
    }

    /* Hoạt ảnh Nhấp nháy hào quang cho Cuốn sách và Nút Chưa thuộc (Màu hoa hồng Rose rực rỡ) */
    @keyframes vocabBlinkGlow {
      0% {
        box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.8) !important;
        transform: scale(1) !important;
      }
      50% {
        box-shadow: 0 0 18px 6px rgba(244, 63, 94, 0.6) !important;
        transform: scale(1.12) !important;
      }
      100% {
        box-shadow: 0 0 0 0 rgba(244, 63, 94, 0) !important;
        transform: scale(1) !important;
      }
    }
    .vocab-tour-blink-glow {
      animation: vocabBlinkGlow 1.5s infinite ease-in-out !important;
      transition: all 0.3s ease !important;
      background-color: #ffe4e6 !important; /* bg-rose-100: làm sáng bừng nền icon */
      border: 1px solid #fda4af !important; /* border màu hồng tinh tế */
      border-radius: 8px !important; /* Giữ nguyên hình vuông bo tròn góc sang trọng của nút gốc */
    }

    @keyframes vocabBlinkGlowBtn {
      0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8) !important;
      }
      50% {
        box-shadow: 0 0 20px 8px rgba(239, 68, 68, 0.5) !important;
      }
      100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0) !important;
      }
    }
    .vocab-tour-blink-glow-btn {
      animation: vocabBlinkGlowBtn 1.5s infinite ease-in-out !important;
      border: 2px solid #ef4444 !important;
    }

    /* CHỈ ĐIỂM NGÔI SAO TRONG BƯỚC TỪ ĐIỂN */
    body.driver-dict-save-step .tour-dict-star-btn {
      position: relative !important;
      animation: vocabBlinkStar 1s infinite alternate ease-in-out !important;
      background-color: #fef08a !important; /* yellow-200 */
      border: 2px solid #eab308 !important; /* yellow-500 */
      border-radius: 8px !important;
      z-index: 9999999 !important;
    }
    
    @keyframes vocabBlinkStar {
      0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.8); transform: scale(1); }
      100% { box-shadow: 0 0 20px 10px rgba(234, 179, 8, 0); transform: scale(1.15); }
    }
    
    body.driver-dict-save-step .tour-dict-star-btn::after {
      content: '';
      position: absolute;
      top: -15px;
      right: -15px;
      bottom: -15px;
      left: -15px;
      border: 3px dashed #eab308;
      border-radius: 50%;
      animation: driverSpin 4s linear infinite;
      pointer-events: none;
    }
    
    body.driver-dict-save-step .tour-dict-star-btn::before {
      content: '⬅ BẤM VÀO ĐÂY';
      position: absolute;
      right: 140%;
      top: 50%;
      transform: translateY(-50%);
      background: #eab308;
      color: #713f12; /* brown/dark yellow text for contrast */
      font-weight: 900;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      letter-spacing: 0.05em;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(234, 179, 8, 0.4);
      animation: driverBounceHorizontal 0.8s infinite alternate ease-in-out;
      pointer-events: none;
    }
    
    @keyframes driverBounceHorizontal {
      from { transform: translate(-8px, -50%); }
      to { transform: translate(5px, -50%); }
    }

    @keyframes driverSpin {
      100% { transform: rotate(360deg); }
    }

    /* BƯỚC BÔI MÀU BẰNG CHỨNG (PART 7) */
    /* Pull the lightbulb and the highlighted sentence above the overlay */
    body.driver-evidence-step .hint-active-lightbulb,
    body.driver-evidence-step .toeic-passage-content [data-sid][style*="background-color"] {
      position: relative !important;
      z-index: 9999999 !important;
      display: inline-block !important; /* Hỗ trợ hiển thị z-index trên thẻ span */
      animation: vocabBlinkStar 1s infinite alternate ease-in-out !important;
      border-radius: 4px;
      box-shadow: 0 0 15px rgba(234, 179, 8, 0.4) !important;
    }

    /* BƯỚC DI CHUỘT DỊCH NGHĨA (PART 7) */
    body.driver-translate-step .tour-translate-demo-target {
      position: relative !important;
      z-index: 9999999 !important;
      display: inline-block !important; /* Hỗ trợ hiển thị z-index trên thẻ span */
      background-color: rgba(99, 102, 241, 0.15) !important; /* light indigo bg */
      outline: 2px solid rgba(99, 102, 241, 0.5) !important;
      border-radius: 4px;
    }
    body.driver-translate-step .tour-translate-tooltip-portal {
      z-index: 9999999 !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * 2. HÀM KHỞI CHẠY TOUR ĐỘNG THEO TỪNG PART & LƯU TRẠNG THÁI LẦN ĐẦU
 * @param partNumber Số hiệu Part thi (1 đến 7)
 * @param forceRun Bằng true nếu muốn ép chạy lại hướng dẫn (ví dụ khi bấm nút Hướng dẫn lại)
 */
export const startToeicPartTour = (partNumber: number, forceRun = false) => {
  const steps = partTourSteps[partNumber === 4 ? 3 : partNumber];
  if (!steps || steps.length === 0) return;

  // Tiêm theme Premium cực đẹp vào trang trước khi chạy
  injectDriverTheme();

  const storageKey = `seen_toeic_tour_part_${partNumber}`;
  const hasSeenTour = localStorage.getItem(storageKey);

  // Chỉ chạy nếu là lần đầu tiên, hoặc được ép chạy thủ công
  if (!hasSeenTour || forceRun) {
    // Duyệt qua các bước để gán selector tương ứng với Part thi
    let updatedSteps = steps.map(step => {
      if (step === dictionaryStep) {
        return {
          ...step,
          element: getDictionarySelector(partNumber)
        };
      }
      return step;
    });

    // Loại bỏ bước fullTestTimerStep nếu không ở chế độ Full Test (phần tử không tồn tại)
    if (typeof document !== "undefined" && !document.getElementById("full-test-part-timer-target")) {
      updatedSteps = updatedSteps.filter(step => step.element !== "#full-test-part-timer-target");
    }

    // Tạo đối tượng target vô hình ở tâm màn hình nếu chưa tồn tại
    if (typeof document !== "undefined" && !document.getElementById("toeic-tour-welcome-target")) {
      const target = document.createElement("div");
      target.id = "toeic-tour-welcome-target";
      target.style.position = "fixed";
      target.style.left = "50%";
      target.style.top = "50%";
      target.style.width = "1px";
      target.style.height = "1px";
      target.style.transform = "translate(-50%, -50%)";
      target.style.pointerEvents = "none";
      target.style.zIndex = "999999";
      document.body.appendChild(target);
    }

    const driverObj = driver({
      showProgress: true,
      popoverClass: "driverjs-theme", // Kích hoạt giao diện Glassmorphism đỉnh cao 5 sao!
      overlayColor: "#0f172a", // Tông tối Slate sang trọng của theme
      overlayOpacity: 0.5,     // Độ mờ tối 50% trong suốt cinematic
      steps: updatedSteps,
      onHighlightStarted: (element, step) => {
        // Tự động ẩn tooltip cũ nếu có (phòng hờ)
        const mockDict = document.getElementById("mock-dict-tooltip");
        if (mockDict) mockDict.remove();

        // 1. Kiểm tra bước Bảng câu hỏi
        const isSidebarStep = element && element.classList.contains("questions-sidebar-portal");

        // 2. Kiểm tra bước Từ điển nhanh
        const isDictStep = element && (
          element.id === "toeic-tour-welcome-target" ||
          element.id === "question-text" ||
          element.classList.contains("passage-container") ||
          element.classList.contains("question-card") ||
          element.classList.contains("tour-dict-star-btn")
        );

        // 3. Kiểm tra bước Nút mở Review Center và Bảng ôn tập Review Center
        const isReviewCenterBtnStep = element && element.id === "review-center-toggle-btn";
        const isReviewCenterPanelStep = element && element.id === "review-center-panel-target";

        // 4. Kiểm tra các bước liên quan đến Sidebar bài học bên trái
        const isLeftSidebarStep = element && (
          element.id === "learn-course-sidebar" ||
          element.id === "review-center-toggle-btn" ||
          element.id === "review-center-panel-target"
        );
        const isDictationStep = step?.popover?.title?.includes("Chép chính tả");
        const isHintStep = step?.popover?.title?.includes("Gợi ý") && !step?.popover?.title?.includes("Bôi màu bằng chứng"); // Hint in part 1/2
        const isDictSaveStep = step?.popover?.title?.includes("Lưu từ vựng nhanh");
        const isEvidenceStep = element && (
          element.classList.contains("hint-active-lightbulb") ||
          step?.popover?.title?.includes("Bôi màu bằng chứng")
        );
        const isTranslateStep = element && (
          element.id === "toeic-passage-container-target" ||
          element.classList.contains("tour-translate-demo-target") ||
          step?.popover?.title?.includes("dịch nghĩa") ||
          step?.popover?.title?.includes("Di chuột")
        );

        // Xử lý class đặc biệt cho body
        if (typeof window !== "undefined") {
          if (isDictSaveStep) {
            document.body.classList.add('driver-dict-save-step');
          } else {
            document.body.classList.remove('driver-dict-save-step');
          }
          
          if (isEvidenceStep) {
            document.body.classList.add('driver-evidence-step');
            window.dispatchEvent(new CustomEvent("toeic-tour-evidence-mode", { detail: { open: true } }));
          } else {
            document.body.classList.remove('driver-evidence-step');
            window.dispatchEvent(new CustomEvent("toeic-tour-evidence-mode", { detail: { open: false } }));
          }

          if (isTranslateStep) {
            document.body.classList.add('driver-translate-step');
            window.dispatchEvent(new CustomEvent("toeic-tour-translate-mode", { detail: { open: true } }));
          } else {
            document.body.classList.remove('driver-translate-step');
            window.dispatchEvent(new CustomEvent("toeic-tour-translate-mode", { detail: { open: false } }));
          }
        }

        // Xử lý đóng/mở sidebar và Review Center ngay lập tức khi phát hiện bước
        if (typeof window !== "undefined") {
          if (isDictationStep) {
            window.dispatchEvent(new CustomEvent("toeic-tour-dictation-mode", { detail: { open: true } }));
          } else {
            window.dispatchEvent(new CustomEvent("toeic-tour-dictation-mode", { detail: { open: false } }));
          }

          if (isHintStep) {
            window.dispatchEvent(new CustomEvent("toeic-tour-hint-mode", { detail: { open: true } }));
          } else {
            window.dispatchEvent(new CustomEvent("toeic-tour-hint-mode", { detail: { open: false } }));
          }
          
          // A. Xử lý Sidebar bài học bên trái (Responsive)
          const isSmallScreen = window.innerWidth < 1280;
          if (isLeftSidebarStep) {
            // Mở bung Sidebar bên trái tự động để học viên nhìn rõ lộ trình
            window.dispatchEvent(new CustomEvent("toeic-tour-course-sidebar", { detail: { open: true } }));
          } else {
            // Ở các bước khác, nếu là màn hình nhỏ thì thu gọn Sidebar bên trái để nhường chỗ hiển thị
            if (isSmallScreen) {
              window.dispatchEvent(new CustomEvent("toeic-tour-course-sidebar", { detail: { open: false } }));
            }
          }

          // B. Xử lý Sidebar bảng câu hỏi bên phải
          if (isSidebarStep) {
            // Mở bung Sidebar làm ví dụ
            window.dispatchEvent(new CustomEvent("toeic-tour-sidebar", { detail: { open: true } }));
          } else {
            // Thu gọn Sidebar lại khi ở các bước khác
            window.dispatchEvent(new CustomEvent("toeic-tour-sidebar", { detail: { open: false } }));
          }

          // C. Xử lý Review Center Drawer
          if (isReviewCenterPanelStep) {
            // Mở bung Review Center làm ví dụ khi đến bước giới thiệu Bảng ôn tập
            window.dispatchEvent(new CustomEvent("toeic-tour-review-center", { detail: { open: true } }));
          } else {
            // Đảm bảo Review Center đóng lại ở các bước khác (kể cả bước chỉ vào nút mở)
            window.dispatchEvent(new CustomEvent("toeic-tour-review-center", { detail: { open: false } }));
          }
        }

        // Đợi popover hiển thị để kiểm tra tiêu đề popover chính xác
        setTimeout(() => {
          const popoverTitle = document.querySelector(".driver-popover-title");
          const isDictTitle = popoverTitle && (
            popoverTitle.innerHTML.includes("Từ điển") ||
            popoverTitle.innerHTML.includes("Lưu từ vựng")
          );

          if (isDictStep && isDictTitle) {
            // Kích hoạt hiển thị popup TỪ ĐIỂN THẬT lộng lẫy bằng Custom Event toàn cục!
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("dictionary-search", { detail: "walkway" }));
            }
          } else {
            // Tắt từ điển thật nếu chuyển sang các bước khác
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("dictionary-close"));
            }
          }
        }, 150);
      },
      onDestroyed: () => {
        // Dọn dẹp đối tượng target vô hình
        const target = document.getElementById("toeic-tour-welcome-target");
        if (target) target.remove();

        // Đóng từ điển thật, thu gọn sidebar và Review Center sạch sẽ khi tắt tour
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("dictionary-close"));
          window.dispatchEvent(new CustomEvent("toeic-tour-sidebar", { detail: { open: false } }));
          window.dispatchEvent(new CustomEvent("toeic-tour-review-center", { detail: { open: false } }));
          window.dispatchEvent(new CustomEvent("toeic-tour-dictation-mode", { detail: { open: false } }));
          window.dispatchEvent(new CustomEvent("toeic-tour-hint-mode", { detail: { open: false } }));

          // Phục hồi trạng thái Sidebar bài học bên trái theo kích thước màn hình ban đầu
          const isSmallScreen = window.innerWidth < 1280;
          window.dispatchEvent(new CustomEvent("toeic-tour-course-sidebar", { detail: { open: !isSmallScreen } }));
          
          document.body.classList.remove('driver-dict-save-step');
          document.body.classList.remove('driver-evidence-step');
          window.dispatchEvent(new CustomEvent("toeic-tour-evidence-mode", { detail: { open: false } }));
          
          document.body.classList.remove('driver-translate-step');
          window.dispatchEvent(new CustomEvent("toeic-tour-translate-mode", { detail: { open: false } }));
        }

        // Lưu trạng thái đã xem hướng dẫn
        localStorage.setItem(storageKey, "true");
      }
    });

    // Bắt đầu chạy Tour Premium cực kỳ mượt mà
    setTimeout(() => {
      driverObj.drive();
    }, 600);
  }
};

// --- TOUR HƯỚNG DẪN HỌC TỪ VỰNG DASHBOARD CHI TIẾT VÀ TƯƠNG TÁC ---
export const startVocabTour = (isCourseMode?: boolean) => {
  if (typeof window === "undefined") return;

  const storageKey = isCourseMode ? "toeic-course-vocab-tour-completed" : "toeic-vocab-tour-completed";
  const isSmallScreen = window.innerWidth < 1280;

  // 1. Kiểm tra xem trên màn hình có ít nhất 1 thẻ Flashcard từ vựng không
  const hasVocabCards = document.querySelector(".vocab-card-first") !== null;

  // 2. Thiết lập kịch bản các bước hướng dẫn
  const steps: any[] = [];

  // Bước 1: Tạo thẻ từ tự động
  steps.push({
    element: "#vocab-title-target",
    popover: {
      title: isCourseMode ? "💡 Học từ vựng theo chủ đề" : "💡 Tạo thẻ từ tự động",
      description: isCourseMode
        ? "Đây là chủ đề của các từ vựng của ngày hôm nay. Học từ vựng theo chủ đề giúp bạn ghi nhớ từ vựng hiệu quả hơn!"
        : "Các từ bạn gắn sao khi tra từ điển sẽ được tạo thẻ từ và tự động lưu vào Sổ tay từ vựng của bạn.",
      side: "bottom"
    }
  });

  // Nếu có thẻ từ vựng trên màn hình
  if (hasVocabCards) {
    steps.push(
      {
        element: ".vocab-card-first .vocab-star-toggle-btn",
        popover: {
          title: isCourseMode ? "⭐ Lưu từ vào Sổ tay ôn tập" : "⭐ Xoá từ vựng khỏi sổ tay",
          description: isCourseMode
            ? "Nhấp vào ngôi sao này để lưu từ vựng khó này vào Sổ tay cá nhân của bạn để ôn tập SRS sau này."
            : "Bạn có thể nhấp vào ngôi sao trên thẻ từ để xoá từ này khỏi Sổ tay từ vựng.",
          side: "top"
        }
      },
      {
        element: ".vocab-card-first .vocab-unlearned-toggle-btn",
        popover: {
          title: "📖 Gắn nhãn Chưa thuộc",
          description: "Bạn có thể gắn nhãn Chưa thuộc (hình quyển sách) để chơi trò chơi chỉ với những thẻ này.",
          side: "top"
        }
      }
    );
  }

  // Đi lên các nút bộ lọc trên cùng
  steps.push(
    {
      element: "#vocab-filters-target",
      popover: {
        title: "🎯 Chọn từ đầu vào cho các trò chơi",
        description: isCourseMode
          ? "Hai nút này là để chọn các từ đầu vào làm nguồn dữ liệu cho các trò chơi luyện tập bên dưới."
          : "Ba nút này là để chọn các từ đầu vào cho các trò chơi.",
        side: "bottom"
      }
    },
    {
      element: "#vocab-filter-all-btn",
      popover: {
        title: "🌐 Nút Tất cả",
        description: isCourseMode
          ? "Chọn Tất cả để luyện tập trò chơi với toàn bộ từ vựng của bài học ngày hôm nay."
          : "Nhấp chọn Tất cả để chọn tất cả từ vựng trong Sổ tay là nguồn vào cho các trò chơi.",
        side: "bottom"
      }
    },
    {
      element: "#vocab-filter-unlearned-btn",
      popover: {
        title: "📕 Nút Chưa thuộc",
        description: "Nhấp chọn Chưa thuộc để chọn các từ có gắn nhãn Chưa thuộc (hình quyển sách) là nguồn vào cho các trò chơi.",
        side: "bottom"
      }
    }
  );

  // Chỉ thêm nút "Cần ôn tập" khi KHÔNG ở CourseMode
  if (!isCourseMode) {
    steps.push({
      element: "#vocab-filter-review-btn",
      popover: {
        title: "⌛ Nút Cần ôn tập",
        description: "Đây là những từ mà hệ thống tự động gợi ý để bạn ôn tập theo phương pháp Spaced Repetition. Nhấp chọn nút này nếu bạn muốn chúng là nguồn vào cho các trò chơi.",
        side: "bottom"
      }
    });
  }

  // Nếu có thẻ từ và KHÔNG ở CourseMode, đục sáng các vạch màu ở chân thẻ từ
  if (hasVocabCards && !isCourseMode) {
    steps.push({
      element: ".vocab-card-first .vocab-srs-bars",
      popover: {
        title: "📊 Cấp độ ghi nhớ (5 Rổ từ vựng)",
        description: "Đây là các vạch màu cho biết từ này đang ở Rổ từ vựng nào (có 5 rổ từ tương ứng với mức độ thuộc của bạn).",
        side: "right"
      }
    });
  }

  // Nút Thư viện
  steps.push({
    element: "#vocab-mode-library-btn",
    popover: {
      title: "📖 Thư viện từ vựng",
      description: "Nhấp vô nút thư viện để xem danh sách toàn bộ thẻ từ bên dưới.",
      side: "bottom"
    }
  });

  // Dãy các trò chơi
  steps.push({
    element: "#vocab-games-target",
    popover: {
      title: "🎮 Luyện tập qua Trò chơi",
      description: "Đây là các trò chơi xếp chữ - điền từ - ghép chữ - đồng nghĩa mà bạn có thể chơi để học từ vựng một cách vui vẻ và hiệu quả nhất.",
      side: "bottom"
    }
  });

  // Nút lật nhanh đồng loạt (nếu có thẻ từ)
  if (hasVocabCards) {
    steps.push({
      element: "#vocab-global-flip-target",
      popover: {
        title: "🔄 Hiện mặt sau",
        description: "Nhấp nút này để hiện mặt sau của toàn bộ các thẻ từ một lần.",
        side: "top"
      }
    });
  }

  // Tiêm CSS tùy chỉnh theme Premium cho popup
  injectDriverTheme();

  // Khởi tạo Driver.js với phong cách Premium đồng bộ 100%
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: "#0f172a",
    overlayOpacity: 0.5,
    popoverClass: "driverjs-theme",
    steps: steps,
    onHighlightStarted: (element, step) => {
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Dọn dẹp sạch sẽ các class nhấp nháy cũ trên DOM khi đổi bước
      document.querySelectorAll(".vocab-tour-blink-glow").forEach((el) => {
        el.classList.remove("vocab-tour-blink-glow");
        (el as HTMLElement).style.zIndex = "";
        (el as HTMLElement).style.position = "";
      });
      document.querySelectorAll(".vocab-tour-blink-glow-btn").forEach((el) => {
        el.classList.remove("vocab-tour-blink-glow-btn");
      });

      // Xóa bỏ Stage đục sáng giả và clone book cũ nếu có
      const oldFakeStage = document.getElementById("vocab-tour-fake-stage");
      if (oldFakeStage) {
        oldFakeStage.remove();
      }
      const oldClonedBook = document.getElementById("vocab-tour-cloned-book");
      if (oldClonedBook) {
        oldClonedBook.remove();
      }

      // Nếu đang đục sáng nút lọc "Chưa thuộc"
      if (step && step.element === "#vocab-filter-unlearned-btn") {
        if (element) {
          element.classList.add("vocab-tour-blink-glow-btn");
        }
        // Đồng thời kéo icon Cuốn sách ở góc trái thẻ lên trên overlay và đục sáng nó bằng fake stage màu trắng tròn trịa!
        const vocabBook = document.querySelector(".vocab-card-first .vocab-unlearned-toggle-btn") as HTMLElement;
        if (vocabBook) {
          const rect = vocabBook.getBoundingClientRect();

          // 1. Tạo fake stage màu trắng tròn che overlay đen (Nổi trên z-index của driver.js overlay)
          const fakeStage = document.createElement("div");
          fakeStage.id = "vocab-tour-fake-stage";
          fakeStage.style.position = "fixed";
          fakeStage.style.top = `${rect.top - 6}px`;
          fakeStage.style.left = `${rect.left - 6}px`;
          fakeStage.style.width = `${rect.width + 12}px`;
          fakeStage.style.height = `${rect.height + 12}px`;
          fakeStage.style.borderRadius = "9999px";
          fakeStage.style.backgroundColor = "#ffffff";
          fakeStage.style.boxShadow = "0 0 0 3px rgba(255, 255, 255, 0.3), 0 0 15px 5px rgba(255, 255, 255, 0.9)";
          fakeStage.style.zIndex = "9999999";
          fakeStage.style.pointerEvents = "none";
          fakeStage.style.transition = "all 0.3s ease";
          document.body.appendChild(fakeStage);

          // 2. Clone icon quyển sách hồng và append vào body để nổi bật trên cùng toàn cục
          const clonedBook = vocabBook.cloneNode(true) as HTMLElement;
          clonedBook.id = "vocab-tour-cloned-book";
          clonedBook.style.position = "fixed";
          clonedBook.style.top = `${rect.top}px`;
          clonedBook.style.left = `${rect.left}px`;
          clonedBook.style.width = `${rect.width}px`;
          clonedBook.style.height = `${rect.height}px`;
          clonedBook.style.zIndex = "10000000"; // Cao nhất, trên cả fake stage trắng và overlay đen
          clonedBook.style.pointerEvents = "none"; // Tránh cản trở click
          clonedBook.classList.add("vocab-tour-blink-glow");
          document.body.appendChild(clonedBook);
        }
      }
    },
    onDestroyed: () => {
      // Khi đóng tour, dọn dẹp sạch sẽ hoàn toàn để trả lại DOM nguyên bản
      document.querySelectorAll(".vocab-tour-blink-glow").forEach((el) => {
        el.classList.remove("vocab-tour-blink-glow");
        (el as HTMLElement).style.zIndex = "";
        (el as HTMLElement).style.position = "";
      });
      document.querySelectorAll(".vocab-tour-blink-glow-btn").forEach((el) => {
        el.classList.remove("vocab-tour-blink-glow-btn");
      });
      const fakeStage = document.getElementById("vocab-tour-fake-stage");
      if (fakeStage) {
        fakeStage.remove();
      }
      const clonedBook = document.getElementById("vocab-tour-cloned-book");
      if (clonedBook) {
        clonedBook.remove();
      }
      localStorage.setItem(storageKey, "true");
    }
  });

  // Chạy tour
  setTimeout(() => {
    driverObj.drive();
  }, 350);
};
