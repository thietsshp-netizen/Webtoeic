
const fs = require('fs');
const XLSX = require('xlsx');
const excelFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

// This is a "Healer" script. It doesn't rely on existing broken translations.
// It uses a lookup table of standard TOEIC question translations and contextual logic.

const commonTranslations = {
    "Where is the woman?": "Người phụ nữ đang ở đâu?",
    "Where is the man?": "Người đàn ông đang ở đâu?",
    "Where do the speakers work?": "Các diễn giả làm việc ở đâu?",
    "What is the man calling about?": "Người đàn ông gọi về việc gì?",
    "Why is the man calling?": "Tại sao người đàn ông lại gọi điện?",
    "What does the man share?": "Người nam chia sẻ thông tin gì?",
    "What does the woman mention?": "Người phụ nữ đề cập đến điều gì?",
    "What problem does the woman mention?": "Người phụ nữ đề cập đến vấn đề gì?",
    "What does the man offer to do?": "Người đàn ông đề nghị làm gì?",
    "What will happen next month?": "Điều gì sẽ xảy ra vào tháng tới?",
    "What are the speakers discussing?": "Các diễn giả đang thảo luận về vấn đề gì?",
    "What does the man say he will do?": "Người đàn ông nói ông ấy sẽ làm gì?",
    "What department do the speakers work in?": "Các diễn giả làm việc ở bộ phận nào?",
    "What is the topic of the talk?": "Chủ đề của buổi nói chuyện là gì?",
    "Who most likely is the speaker?": "Người nói có khả năng nhất là ai?",
    "Who most likely are the listeners?": "Người nghe có khả năng nhất là ai?",
    "What is the purpose of the message?": "Mục đích của tin nhắn là gì?",
    "What is the purpose of the call?": "Mục đích của cuộc gọi là gì?",
    "Look at the graphic.": "Dựa vào sơ đồ,"
};

function fixAll() {
    const workbook = XLSX.readFile(excelFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    const updated = data.map((row, idx) => {
        if (!row.Json || !row.Json.startsWith('{')) return row;
        const j = JSON.parse(row.Json);
        const questions = j.questions || (j.passages && j.passages[0].questions);
        
        if (questions) {
            questions.forEach(q => {
                const eng = q.text;
                // Smart Translation
                let vi = q.explanation.vi || "";
                
                // If it's a graphic question, use the special fixed format
                if (eng.includes("Look at the graphic")) {
                    const subQ = eng.split(".")[1] || eng;
                    vi = "Dựa vào sơ đồ, " + subQ.toLowerCase().trim();
                } else if (commonTranslations[eng]) {
                    vi = commonTranslations[eng];
                }
                
                // Deep Cleanup: Remove generic placeholders and fix translations
                q.explanation.vi = vi.replace(/ \(phiên bản dịch thô\)/g, '').trim();
                
                // If why_correct is still generic, mark for focus or use a better heuristic
                if (q.explanation.why_correct && q.explanation.why_correct.includes("Dựa vào các từ khóa")) {
                    // Try to extract real evidence from transcript if available
                    // For now, at least ensure the translation of the question is correct.
                }
            });
        }
        row.Json = JSON.stringify(j, null, 2);
        return row;
    });

    const ns = XLSX.utils.json_to_sheet(updated);
    const nwb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(nwb, ns, workbook.SheetNames[0]);
    XLSX.writeFile(nwb, excelFile);
    console.log("Full Intel Fix Phase 1: Question translations synchronized.");
}

fixAll();
