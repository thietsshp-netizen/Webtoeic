<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Strict Code Modification Policy
- CRITICAL: NEVER modify, edit, create, or delete any source files when the user asks questions, requests analysis, or asks for explanations.
- ONLY modify files when the user EXPLICITLY commands to edit/fix code (e.g., "sửa code", "thêm tính năng", "thay đổi file").
- For all informational, investigatory, or status questions, provide text-based responses only.

# Transparent Code Editing Workflow
- BEFORE editing code: You MUST analyze the code step-by-step, clearly explain your findings, state the exact root cause, and summarize the fix plan to the user.
- DURING editing: Explain each edit transparently as you perform it. Never make silent or unexplained edits in bulk.

# Strict Terminal & Command Execution Policy (Quy Định Chạy Lệnh Terminal)
- **BẮT BUỘC TRÌNH BÀY RÕ RÀNG TRƯỚC KHI CHẠY LỆNH**: Trước khi đề xuất hoặc chạy bất kỳ lệnh terminal nào (cần người dùng phê duyệt hoặc ảnh hưởng tới hệ thống), trợ lý PHẢI luôn trình bày chi tiết và rõ ràng trong tin nhắn:
  1. Lệnh chuẩn bị chạy là lệnh gì cụ thể.
  2. Tại sao cần chạy lệnh này (mục đích).
  3. Lệnh này sẽ tác động gì và kết quả mong đợi ra sao.
- **TUYỆT ĐỐI KHÔNG CHẠY LỆNH NGẦM BẤT NGỜ**: Không tự ý chạy các script ngầm (curl, node script quét mạng, browser subagent...) khiến bảng thông báo phê duyệt (Approval Dialog) của IDE bật lên liên tục làm gián đoạn và phiền toái người dùng.
- **NGƯỜI DÙNG PHẢI LUÔN BIẾT RÕ MÌNH ĐANG DUYỆT CÁI GÌ**: Tránh tuyệt đối việc đưa yêu cầu duyệt mà không có phần giải trình minh bạch trước đó.

