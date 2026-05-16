import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

// Configuration
const INPUT_PATH = path.join(process.cwd(), 'Part 3_4', 'Part 3_4.xlsx');
const OUTPUT_PATH = path.join(process.cwd(), 'Part34_Json.xlsx');

// Predefined abbreviations to avoid splitting sentences incorrectly
const ABBREVIATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'St.', 'Ave.', 'Inc.', 'Corp.', 'A.M.', 'P.M.', 'no.', 'approx.'];

function cleanText(text: string) {
    if (!text) return "";
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Splits text into sentences intelligently, handling bold markers and abbreviations.
 */
function splitIntoSentences(text: string): string[] {
    if (!text) return [];

    // 1. First, preserve speaker turns/paragraphs
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    let allSentences: string[] = [];

    paragraphs.forEach(para => {
        // Handle speaker label at the beginning
        let prefix = "";
        const speakerMatch = para.match(/^(\*\*.*?\:\*\*|\w+\:)/);
        if (speakerMatch) {
            prefix = speakerMatch[0];
            para = para.substring(prefix.length).trim();
        }

        // Split by period/question/exclamation followed by space (or end of string)
        // This regex tries to ignore dots followed by lowercase (like in abbreviations)
        // or dots followed by ** (formatting)
        const sentences = para.split(/(?<=[.?!])(\s+)(?=[A-Z0-9$*])|(?<=[.?!])(\s*$)/g)
            .filter(s => s && s.trim().length > 0);

        const processed = sentences.map((s, idx) => {
            let final = s.trim();
            if (idx === 0 && prefix) {
                // Prepend speaker to first sentence of paragraph, but make it bold HTML
                const displayPrefix = prefix.replace(/\*\*(.*?)\:\*\*/, '<b>$1:</b>').replace(/^(.*?)\:/, '<b>$1:</b>');
                final = displayPrefix + " " + final;
            }
            return final;
        });

        allSentences = allSentences.concat(processed);
    });

    return allSentences;
}

function processGroup(groupRows: any[]) {
    const firstRow = groupRows[0];
    const enTranscript = cleanText(firstRow.Transcript_EN);
    const viTranscript = cleanText(firstRow.Transcript_VI);

    const enSentences = splitIntoSentences(enTranscript);
    const viSentences = splitIntoSentences(viTranscript);

    // Sync sentences counts if mismatched (by merging extra EN into last VI)
    const syncedVi = [...viSentences];
    const syncedEn = [...enSentences];

    // If counts differ significantly, we might have a problem, 
    // but we'll force sync by grouping for now to maintain valid SID mapping.
    while (syncedEn.length > syncedVi.length && syncedVi.length > 0) {
        // Merge the last two EN sentences
        const last = syncedEn.pop();
        syncedEn[syncedEn.length - 1] += " " + last;
    }
    while (syncedVi.length > syncedEn.length && syncedEn.length > 0) {
        // Merge last two VI sentences
        const last = syncedVi.pop();
        syncedVi[syncedVi.length - 1] += " " + last;
    }

    const translation_map: Record<string, string> = {};
    let html_content = "";
    const sentenceEvidenceMap: Record<number, string[]> = {};

    syncedEn.forEach((en, idx) => {
        const sid = `s${idx + 1}`;
        translation_map[sid] = syncedVi[idx] || "";
        
        // Find evidence markers like $^{32}$ and clean them for display while keeping for metadata
        const evidenceMatches = en.match(/\$\^\{(\d+)\}\$/g);
        if (evidenceMatches) {
            evidenceMatches.forEach(m => {
                const qNo = parseInt(m.match(/\d+/)![0]);
                if (!sentenceEvidenceMap[qNo]) sentenceEvidenceMap[qNo] = [];
                sentenceEvidenceMap[qNo].push(sid);
            });
        }

        // Clean up the evidence tags from the display HTML
        const displayEn = en.replace(/\$\^\{(\d+)\}\$/g, '');
        html_content += `<div data-sid='${sid}'>${displayEn}</div>`;
    });

    // Process Questions
    const questions = groupRows.sort((a,b) => (a.Question_No || 0) - (b.Question_No || 0)).map(row => {
        const qNo = parseInt(row.Question_No) || 0;
        return {
            questionNo: qNo,
            text: String(row.Question_EN || "").replace(/\$\^\{(\d+)\}\$/g, '').trim(),
            options: {
                A: String(row.Option_A_EN || ""),
                B: String(row.Option_B_EN || ""),
                C: String(row.Option_C_EN || ""),
                D: String(row.Option_D_EN || "")
            },
            correct: String(row.Correct_Answer || "A").trim().toUpperCase(),
            evidence_sids: sentenceEvidenceMap[qNo] || [],
            explanation: {
                vi: String(row.Question_VI || "").trim(),
                options_vn: {
                    A: String(row.Option_A_VI || ""),
                    B: String(row.Option_B_VI || ""),
                    C: String(row.Option_C_VI || ""),
                    D: String(row.Option_D_VI || "")
                }
            }
        };
    });

    const jsonField = {
        passages: [
            {
                category: firstRow.Part === 3 ? "Conversation" : "Short Talk",
                html_content: html_content,
                translation_map: translation_map
            }
        ],
        questions: questions
    };

    return {
        Book: firstRow.Book,
        Test: firstRow.Test,
        Part: firstRow.Part,
        AudioID: firstRow.AudioID,
        PicID: firstRow.PicID || "",
        Day: firstRow.Day,
        Json: JSON.stringify(jsonField)
    };
}

async function main() {
    console.log(`Reading source: ${INPUT_PATH}`);
    if (!fs.existsSync(INPUT_PATH)) {
        console.error("Source file not found!");
        return;
    }

    const workbook = xlsx.readFile(INPUT_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`Loaded ${rows.length} rows.`);

    // Group by AudioID
    const groups: Record<string, any[]> = {};
    rows.forEach((row: any) => {
        const id = row.AudioID;
        if (!groups[id]) groups[id] = [];
        groups[id].push(row);
    });

    const convertedRows = Object.values(groups).map(group => processGroup(group));

    console.log(`Converted into ${convertedRows.length} groups.`);

    // Create new Workbook
    const newWb = xlsx.utils.book_new();
    const newWs = xlsx.utils.json_to_sheet(convertedRows);
    
    // Set column width for Json column to be large
    newWs['!cols'] = [
        { wch: 15 }, // Book
        { wch: 10 }, // Test
        { wch: 10 }, // Part
        { wch: 30 }, // AudioID
        { wch: 20 }, // PicID
        { wch: 20 }, // Day
        { wch: 100 } // Json
    ];

    xlsx.utils.book_append_sheet(newWb, newWs, "Part34_Json");
    xlsx.writeFile(newWb, OUTPUT_PATH);

    console.log(`Success! File saved at: ${OUTPUT_PATH}`);
}

main().catch(console.error);
