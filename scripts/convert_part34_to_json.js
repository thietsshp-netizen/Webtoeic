const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const INPUT_PATH = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part 3_4.xlsx';
const OUTPUT_PATH = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json.xlsx';

function preFormat(text) {
    if (!text) return "";
    let t = text.toString();
    t = t.replace(/\$\^\{(.*?)\}\$/g, '<sup>$1</sup>');
    t = t.replace(/\*\*+(.*?)\:+\*\*+/g, '<b>$1:</b>');
    t = t.replace(/\*\*(.*?)\*\*/g, (match, content) => {
        const sentences = content.split(/(?<=[.?!])\s+/);
        return sentences.map(s => `<b>${s.trim()}</b>`).join(' ');
    });
    return t.replace(/\s+/g, ' ').trim();
}

function splitIntoSids(formattedText) {
    if (!formattedText) return [];
    return formattedText.split(/(?<=[.?!])(?:<\/.*?>)?\s+/).filter(s => s.trim().length > 0);
}

function processRows(group) {
    const sorted = group.sort((a,b) => (a.Question_No||0)-(b.Question_No||0));
    const firstRow = sorted[0];
    const range = `${sorted[0].Question_No}-${sorted[sorted.length-1].Question_No}`;

    const enSents = splitIntoSids(preFormat(firstRow.Transcript_EN));
    const viSents = splitIntoSids(preFormat(firstRow.Transcript_VI));

    while (enSents.length > viSents.length && viSents.length > 0) { enSents[enSents.length - 2] += " " + enSents.pop(); }
    while (viSents.length > enSents.length && enSents.length > 0) { viSents[viSents.length - 2] += " " + viSents.pop(); }

    const translation_map = {};
    let html_content = "";
    const evidenceMap = {};
    let activeEvidenceNums = [];

    enSents.forEach((en, i) => {
        const sid = `s${i+1}`;
        let finalEn = en.trim();
        const supMatch = finalEn.match(/<sup>(.*?)<\/sup>/);
        if (supMatch) {
            const nums = supMatch[1].split(/[,&-]/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
            activeEvidenceNums = nums;
        }
        activeEvidenceNums.forEach(num => {
            if (!evidenceMap[num]) evidenceMap[num] = [];
             if (!evidenceMap[num].includes(sid)) evidenceMap[num].push(sid);
        });
        if (!finalEn.includes('<b>') || finalEn.endsWith('</b>')) { activeEvidenceNums = []; }

        translation_map[sid] = viSents[i] || "";
        html_content += `<div data-sid='${sid}'>${finalEn}</div>`;
    });

    const simpleFmt = (t) => t ? t.toString().replace(/\$\^\{(.*?)\}\$/g, '<sup>$1</sup>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').trim() : "";

    // CẬP NHẬT CATEGORY KÈM RANGE
    const categoryName = (firstRow.Part === 3 ? "Conversation" : "Short Talk") + " " + range;

    const jsonResult = JSON.stringify({
        passages: [{ category: categoryName, html_content, translation_map }],
        questions: sorted.map(row => ({
            questionNo: parseInt(row.Question_No),
            text: simpleFmt(row.Question_EN),
            options: { A: simpleFmt(row.Option_A_EN), B: simpleFmt(row.Option_B_EN), C: simpleFmt(row.Option_C_EN), D: simpleFmt(row.Option_D_EN) },
            correct: String(row.Correct_Answer || "A").trim().toUpperCase(),
            evidence_sids: evidenceMap[parseInt(row.Question_No)] || [],
            explanation: { 
                vi: simpleFmt(row.Question_VI), 
                options_vn: { A: simpleFmt(row.Option_A_VI), B: simpleFmt(row.Option_B_VI), C: simpleFmt(row.Option_C_VI), D: simpleFmt(row.Option_D_VI) } 
            }
        }))
    });

    return {
        Book: firstRow.Book,
        Test: firstRow.Test,
        Part: firstRow.Part,
        AudioID: firstRow.AudioID,
        Day: firstRow.Day,
        PicID: firstRow.PicID,
        QuestionRange: range,
        Json: jsonResult
    };
}

async function main() {
    const workbook = xlsx.readFile(INPUT_PATH);
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const groups = {};
    rows.forEach(r => { if (!groups[r.AudioID]) groups[r.AudioID] = []; groups[r.AudioID].push(r); });
    const converted = Object.values(groups).map(g => processRows(g));
    const newWs = xlsx.utils.json_to_sheet(converted);
    const newWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWb, newWs, "Part34_Json");
    xlsx.writeFile(newWb, OUTPUT_PATH);
    console.log("Xong! Category đã được cập nhật kèm dải câu hỏi.");
}
main().catch(console.error);
