
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json.xlsx';
const outputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const speakerMap = {
    'Am': 'Mỹ',
    'Br': 'Anh',
    'Au': 'Úc',
    'Ca': 'Canada',
    'Cn': 'Trung Quốc',
    'In': 'Ấn Độ', // Standard TOEIC
    'Nz': 'New Zealand'
};

function fixHtml(html) {
    if (!html) return html;
    
    // 1. Ensure <div> tags are balanced first
    // Some rows have <div data-sid='s1'>... (no closing)
    // This is complex, but we can try to wrap content between <div> correctly
    
    // 2. Fix unclosed <b> tags inside each div
    // We'll split by </div> to isolate segments
    let segments = html.split('</div>');
    let fixedSegments = segments.map(seg => {
        if (!seg.trim()) return seg;
        
        let content = seg;
        // Count <b> and </b>
        let bCount = (content.match(/<b>/g) || []).length;
        let bCloseCount = (content.match(/<\/b>/g) || []).length;
        
        if (bCount > bCloseCount) {
            content += '</b>'.repeat(bCount - bCloseCount);
        }
        
        // Ensure the segment ends with its div if it started with one
        if (seg.includes('<div')) {
            return content + '</div>';
        }
        return content;
    });
    
    return fixedSegments.join('');
}

function normalizeSpeaker(text, isVietnamese = false) {
    if (!text) return text;
    // Regex to find <b>[W/M][ -][Am/Br/etc]:</b>
    const speakerRegex = /<b>([WM])[- ]?([A-Za-z]{2}):<\/b>/g;
    
    return text.replace(speakerRegex, (match, gender, code) => {
        const country = speakerMap[code] || code;
        const genderVi = gender === 'W' ? 'Nữ' : 'Nam';
        
        if (isVietnamese) {
            return `<b>${genderVi} (${country}):</b>`;
        } else {
            // Standardize English side to W-Am: 
            return `<b>${gender}-${code}:</b>`;
        }
    });
}

try {
    const workbook = XLSX.readFile(inputFile);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(datasheet);

    console.log(`Processing ${rows.length} rows...`);

    const processedRows = rows.map((row, index) => {
        if (!row.Json || !row.Json.trim().startsWith('{')) return row;

        try {
            let data = JSON.parse(row.Json);
            
            if (data.passages) {
                data.passages.forEach(p => {
                    // Fix HTML tags
                    p.html_content = fixHtml(p.html_content);
                    
                    // Normalize Speakers in English HTML
                    p.html_content = normalizeSpeaker(p.html_content, false);
                    
                    // Normalize Speakers in Vietnamese Translation
                    if (p.translation_map) {
                        Object.keys(p.translation_map).forEach(sid => {
                            p.translation_map[sid] = normalizeSpeaker(p.translation_map[sid], true);
                        });
                    }
                });
            }

            if (data.questions) {
                data.questions.forEach(q => {
                    if (!q.explanation) q.explanation = {};
                    
                    // Placeholder for analysis - we will enrich this if missing
                    // For now, ensure structure is correct
                    if (q.explanation.vi && !q.explanation.options_vn) {
                       // If vi exists but options_vn is missing, check if it's lumped
                    }
                });
            }

            row.Json = JSON.stringify(data, null, 2);
        } catch (e) {
            console.error(`Error parsing JSON at row ${index + 1}: ${e.message}`);
        }
        return row;
    });

    const newSheet = XLSX.utils.json_to_sheet(processedRows);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
    XLSX.writeFile(newWorkbook, outputFile);

    console.log(`Done! Saved fixed file to ${outputFile}`);
} catch (error) {
    console.error('Core Error:', error.message);
}
