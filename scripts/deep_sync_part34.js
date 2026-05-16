
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json.xlsx';
const outputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const speakerMap = { 'Am': 'Mỹ', 'Br': 'Anh', 'Au': 'Úc', 'Ca': 'Canada', 'Cn': 'Trung Quốc' };

const analysisPatches = {
  "ETS2024_TEST_01_32_34": [
    "Người nam chào 'Chef Ayaka' và thảo luận về doanh số món 'beef stew', cho thấy họ làm việc tại nhà hàng.",
    "Người nam đề cập việc giá thịt bò (beef prices) thay đổi thường xuyên nên cần cân nhắc khi lập giá cho món ăn.",
    "Người nữ nói 'I'll call our supplier' để đảm bảo lượng thịt bò cung cấp, tức là liên hệ với nhà cung cấp."
  ],
  "ETS2024_TEST_02_32_34": [
    "Người nam chào 'Captain' và nhắc đến việc cập cảng (docking at the port), xác nhận bối cảnh là trên tàu thủy.",
    "Người phụ nữ giải thích do phải đổi hướng để tránh bão nên tàu bị chậm so với lịch trình.",
    "Người phụ nữ yêu cầu người nam đi kiểm tra máy móc trong phòng động cơ."
  ]
};

const hardFixes = {
    "ETS2026_TEST_02_59_61": {
        "passages": [{ "category": "Conversation 59-61", "html_content": "<div data-sid='s1'><b>W-Am:</b> Hello. I'd like to buy some floor mats for <sup>59</sup><b>my hair salon.</b></div>", "translation_map": { "s1": "<b>Nữ (Mỹ):</b> Xin chào. Tôi muốn mua thảm cho <sup>59</sup><b>tiệm làm tóc của mình.</b>" } }],
        "questions": [{ "questionNo": 59, "text": "What business...?", "options": { "A": "Hair salon", "B": "Clinic" }, "correct": "A", "evidence_sids": ["s1"], "explanation": { "vi": "Dịch câu hỏi", "why_correct": "Cô ấy nhắc đến hair salon." } }]
    },
    "ETS2026_TEST_04_59_61": {
        "passages": [{ "category": "Conversation 59-61", "html_content": "<div data-sid='s1'><b>W-Am:</b> Hello. My hair salon...</div>", "translation_map": { "s1": "..." } }],
        "questions": [{ "questionNo": 59, "text": "?", "options": { "A": "A hair salon" }, "correct": "A", "explanation": { "vi": "Cửa hàng của người phụ nữ là gì?", "why_correct": "Cô ấy nói 'my hair salon'." } }]
    }
};

function fixHtml(html) {
    if (!html) return html;
    let segments = html.split('</div>');
    return segments.map(seg => {
        if (!seg.trim()) return seg;
        let content = seg;
        let bCount = (content.match(/<b>/g) || []).length;
        let bCloseCount = (content.match(/<\/b>/g) || []).length;
        if (bCount > bCloseCount) content += '</b>'.repeat(bCount - bCloseCount);
        return seg.includes('<div') ? content + '</div>' : content;
    }).join('');
}

function normalizeSpeaker(text, isVietnamese = false) {
    if (!text) return text;
    return text.replace(/<b>([WM])[- ]?([A-Za-z]{2}):<\/b>/g, (m, g, c) => {
        const country = speakerMap[c] || c;
        return isVietnamese ? `<b>${g === 'W' ? 'Nữ' : 'Nam'} (${country}):</b>` : `<b>${g}-${c}:</b>`;
    });
}

function classifyContent(text) {
    if (!text) return 'empty';
    const t = String(text).trim();
    if (t.includes('?') && t.length < 150) return 'translation';
    if (t.match(/^(Người|Văn bản|Dựa vào|Vì|Do|Theo|Trong|Tại|Đó là)/) || t.length > 80) return 'analysis';
    return 'unknown';
}

function translateQuestion(text) {
    if (!text) return "";
    const t = String(text);
    if (t.includes('Where does the conversation most likely take place')) return "Cuộc hội thoại có khả năng nhất diễn ra ở đâu?";
    if (t.includes('Who most likely is the speaker')) return "Người nói có khả năng nhất là ai?";
    if (t.includes('What is the speaker mainly discussing')) return "Người nói chủ yếu thảo luận về yếu tố nào?";
    if (t.includes('What problem does the')) return "Người phụ nữ đề cập đến vấn đề gì?";
    if (t.includes('What will the woman most likely do next')) return "Người phụ nữ có khả năng nhất sẽ làm gì tiếp theo?";
    if (t.includes('What type of event is being held tonight')) return "Loại sự kiện nào được tổ chức tối nay?";
    if (t.includes('What does the speaker say she has to do at noon')) return "Người nói cho biết cô ấy phải làm gì vào buổi trưa?";
    if (t.includes('Look at the graphic')) return "Dựa vào sơ đồ/hình ảnh bổ sung. Nhiệm vụ nào sẽ được giao?";
    if (t.includes('What are the speakers discussing')) return "Các diễn giả đang thảo luận về vấn đề gì?";
    if (t.includes('What does the woman want to avoid')) return "Người phụ nữ muốn tránh điều gì?";
    if (t.includes('What business does the woman work in')) return "Người phụ nữ làm việc trong lĩnh vực kinh doanh nào?";
    if (t.includes('Why does the woman say')) return "Tại sao người phụ nữ nói: [trích dẫn]?";
    if (t.includes('What does the man’s business offer')) return "Doanh nghiệp của người đàn ông cung cấp dịch vụ gì?";
    if (t.includes('What does the speakers\' company manufacture')) return "Công ty của các diễn giả sản xuất mặt hàng gì?";
    if (t.includes('What will the woman do next')) return "Người phụ nữ sẽ làm gì tiếp theo?";
    
    return ""; 
}

try {
    const workbook = XLSX.readFile(inputFile);
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const processed = data.map(row => {
        let j;
        if (hardFixes[row.AudioID]) {
            j = hardFixes[row.AudioID];
        } else if (row.Json && String(row.Json).trim().startsWith('{')) {
            try {
                j = JSON.parse(row.Json);
            } catch (e) { return row; }
        } else {
            return row;
        }

        try {
            if (j.passages) {
                j.passages.forEach(p => {
                    p.html_content = fixHtml(normalizeSpeaker(p.html_content, false));
                    if (p.translation_map) {
                        Object.keys(p.translation_map).forEach(sid => {
                            p.translation_map[sid] = normalizeSpeaker(p.translation_map[sid], true);
                        });
                    }
                });
            }

            if (j.questions) {
                j.questions.forEach((q, i) => {
                    let oldExp = q.explanation || {};
                    let newExp = { vi: '', options_vn: {}, why_correct: '' };

                    if (typeof oldExp === 'string') {
                        newExp.why_correct = oldExp;
                    } else {
                        newExp.vi = String(oldExp.vi || '');
                        newExp.options_vn = oldExp.options_vn || {};
                        newExp.why_correct = oldExp.why_correct || oldExp.analysis || oldExp.whyCorrect || '';
                    }

                    const type = classifyContent(newExp.vi);
                    if (type === 'analysis' && (!newExp.why_correct || newExp.why_correct === "")) {
                        newExp.why_correct = newExp.vi;
                        newExp.vi = ""; 
                    }

                    if (!newExp.vi || newExp.vi.trim() === "") {
                        newExp.vi = translateQuestion(q.text);
                    }

                    if (analysisPatches[row.AudioID] && analysisPatches[row.AudioID][i]) {
                        newExp.why_correct = analysisPatches[row.AudioID][i];
                    }

                    q.explanation = newExp;
                });
            }
            row.Json = JSON.stringify(j, null, 2);
        } catch (e) { }
        return row;
    });

    const newSheet = XLSX.utils.json_to_sheet(processed);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newSheet, workbook.SheetNames[0]);
    XLSX.writeFile(newWb, outputFile);
    console.log("Deep synchronization complete.");
} catch (e) { console.error(e.message); }
