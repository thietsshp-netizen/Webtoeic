import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCEL_PATH = '/Users/thietphamvan/hoctoeic/Webtoeic/Cụm_Gốc_Tiền tố/Các từ đồng-trái nghĩa_Cụm_Gốc từ_Tiền tố.xlsx';
const OUTPUT_DIR = '/Users/thietphamvan/hoctoeic/Webtoeic/src/data';
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'word_families.json');

function cleanWord(w) {
  return w.replace(/[(),:;=~><\-#+]/g, '').trim();
}

function isEnglishWord(w, maxWords = 999) {
  const vnAccents = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const wordCount = w.trim().split(/\s+/).length;
  return /^[a-zA-Z\s'-]+$/.test(w) && !vnAccents.test(w) && w.trim().length > 1 && wordCount <= maxWords;
}

function expandCollocations(line) {
  const results = [];
  
  // Clean up bullets and common symbols at start
  line = line.replace(/^[\-\*\s\+]+/, '').trim();
  
  // Pattern A: list/of/words + main_word
  const plusMatch = line.match(/^([a-zA-Z0-9\s'\/]+)\s*\+\s*([a-zA-Z0-9\s'-]+)/);
  if (plusMatch) {
    const listPart = plusMatch[1];
    const mainWord = plusMatch[2].trim();
    const options = listPart.split('/');
    options.forEach(opt => {
      results.push(`${opt.trim()} ${mainWord}`);
    });
    return results;
  }
  
  // Pattern B: main_word + list/of/words
  const plusMatchRev = line.match(/^([a-zA-Z0-9\s'-]+)\s*\+\s*([a-zA-Z0-9\s'\/]+)/);
  if (plusMatchRev) {
    const mainWord = plusMatchRev[1].trim();
    const listPart = plusMatchRev[2];
    const options = listPart.split('/');
    options.forEach(opt => {
      results.push(`${mainWord} ${opt.trim()}`);
    });
    return results;
  }
  
  // Pattern C: list/of/words word (e.g. "previous/past/last year")
  const slashMatch = line.match(/^([a-zA-Z0-9'\/]+)\s+([a-zA-Z0-9\s'-]+)/);
  if (slashMatch && slashMatch[1].includes('/')) {
    const listPart = slashMatch[1];
    const mainWord = slashMatch[2].trim();
    const options = listPart.split('/');
    options.forEach(opt => {
      results.push(`${opt.trim()} ${mainWord}`);
    });
    return results;
  }

  // Pattern D: word list/of/words (e.g. "by bus/car")
  const slashMatchRev = line.match(/^([a-zA-Z0-9\s'-]+)\s+([a-zA-Z0-9'\/]+)$/);
  if (slashMatchRev && slashMatchRev[2].includes('/')) {
    const mainWord = slashMatchRev[1].trim();
    const listPart = slashMatchRev[2];
    const options = listPart.split('/');
    options.forEach(opt => {
      results.push(`${mainWord} ${opt.trim()}`);
    });
    return results;
  }
  
  return results;
}

try {
  console.log('Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`Read ${data.length} rows.`);
  const wordFamilies = [];

  data.forEach((row, i) => {
    if (i === 0) return; // Skip header
    const rawKey = row[0];
    const rawVal = row[1];
    if (!rawKey || !rawVal) return;
    
    const key = String(rawKey).trim();
    const value = String(rawVal).trim();
    
    // Check if it is a Root (has leading/trailing hyphens)
    const isRoot = key.startsWith('-') || key.endsWith('-') || key.includes('-dict-') || key.includes('-mit-') || key.includes('-ced-') || key.includes('-vis-');
    
    // Check if key is in Vietnamese (contains Vietnamese accents)
    const vnAccents = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    const isVnKey = vnAccents.test(key);

    const stopWords = new Set([
      'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall',
      'have', 'has', 'had', 'having', 'do', 'does', 'did', 'done', 'doing',
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'go', 'goes', 'went', 'gone',
      'the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'about', 'against',
      'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'theirs',
      'he', 'she', 'him', 'her', 'his', 'hers', 'we', 'us', 'our', 'ours', 'i', 'me', 'my', 'mine',
      'you', 'your', 'yours', 'who', 'whom', 'whose', 'which', 'what', 'why', 'how',
      'and', 'but', 'or', 'so', 'if', 'because', 'as', 'until', 'while', 'though', 'although'
    ]);
    
    if (isRoot) {
      // It is a root key (e.g., "-sid/-sed-")
      // Extract roots by splitting by slash and removing hyphens
      const roots = key.split('/')
                       .map(r => r.replace(/\-/g, '').trim())
                       .filter(r => r.length > 0);
      
      const extractedWords = new Set();
      const lines = value.split(/\r?\n/);
      lines.forEach(line => {
        const expanded = expandCollocations(line);
        if (expanded.length > 0) {
          expanded.forEach(w => {
            const wLower = w.toLowerCase();
            if (!stopWords.has(wLower)) {
              // Root words must contain at least one of the root stems
              const matchesRoot = roots.some(r => wLower.includes(r.toLowerCase()));
              if (matchesRoot) {
                extractedWords.add(wLower);
              }
            }
          });
          return;
        }
        
        let cleanedLine = line.replace(/\((v|n|adj|adv|prep|conj|pron|s|es|ed|ing)\)/gi, ' ');
        const parts = cleanedLine.split(/[\r\n=~:;+|]|><|->/);
        parts.forEach(part => {
          let w = part.trim();
          w = w.replace(/\b(v|n|adj|adv|prep|conj|pron)\b\.?/gi, '').trim();
          w = w.replace(/^[\-\*\s\+]+/, '').trim(); // Remove leading bullets
          const wLower = w.toLowerCase();
          if (isEnglishWord(w, 3) && w.length > 2 && !stopWords.has(wLower)) {
            const matchesRoot = roots.some(r => wLower.includes(r.toLowerCase()));
            if (matchesRoot) {
              extractedWords.add(wLower);
            }
          }
        });
      });
      
      wordFamilies.push({
        id: `row-${i}`,
        type: 'root',
        key: key,
        roots: roots,
        words: Array.from(extractedWords),
        originalValue: value
      });
    } else {
      // It is a standard word/collocation key
      const extractedWords = new Set();
      
      // Clean and add the main key (only if not a Vietnamese key)
      const keyWords = [];
      const stems = [];
      if (!isVnKey) {
        const keysSplit = key.split(/[\/,]/);
        keysSplit.forEach(k => {
          let cleaned = cleanWord(k);
          cleaned = cleaned.replace(/\b(v|n|adj|adv|prep|conj|pron)\b\.?/gi, '').trim();
          if (isEnglishWord(cleaned) && !stopWords.has(cleaned.toLowerCase())) {
            extractedWords.add(cleaned.toLowerCase());
            keyWords.push(cleaned.toLowerCase());
            stems.push(cleaned.toLowerCase().substring(0, Math.min(cleaned.length, 3)));
          }
        });
      }
      
      // Extract words from Column 2 (value) (only if not a Vietnamese key)
      if (!isVnKey) {
        const lines = value.split(/\r?\n/);
        lines.forEach(line => {
          let cleanedLine = line.replace(/^[\-\*\s\+]+/, '').trim();
          cleanedLine = cleanedLine.replace(/\((v|n|adj|adv|prep|conj|pron|s|es|ed|ing)\)/gi, ' ');
          
          // Split by major translation delimiters
          const parts = cleanedLine.split(/[\r\n=~;|]|><|->/);
          parts.forEach(part => {
            // Further split by commas
            const subparts = part.split(',');
            subparts.forEach(sub => {
              let phrase = sub.trim();
              if (phrase.length === 0) return;
              
              const expanded = expandCollocations(phrase);
              if (expanded.length > 0) {
                expanded.forEach(w => {
                  const wLower = w.toLowerCase();
                  if (!stopWords.has(wLower)) {
                    const matchesStem = stems.some(stem => wLower.includes(stem)) || keyWords.some(kw => wLower.includes(kw));
                    if (matchesStem) {
                      extractedWords.add(wLower);
                    }
                  }
                });
              } else {
                phrase = phrase.replace(/\b(v|n|adj|adv|prep|conj|pron)\b\.?/gi, '').trim();
                const wLower = phrase.toLowerCase();
                if (isEnglishWord(phrase, 3) && phrase.length > 2 && !stopWords.has(wLower)) {
                  const matchesStem = stems.some(stem => wLower.includes(stem)) || keyWords.some(kw => wLower.includes(kw));
                  if (matchesStem) {
                    extractedWords.add(wLower);
                  }
                }
              }
            });
          });
        });
      }
      
      // We still keep the entry if the key is Vietnamese (so it can be viewed if matched by other means or if you want to keep it),
      // but its matching words list will be empty so it won't match common English words.
      wordFamilies.push({
        id: `row-${i}`,
        type: 'word',
        key: key,
        words: Array.from(extractedWords),
        originalValue: value
      });
    }
  });

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write JSON
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(wordFamilies, null, 2), 'utf-8');
  console.log(`Successfully parsed Excel and saved ${wordFamilies.length} word families to ${OUTPUT_PATH}`);
  
} catch (e) {
  console.error('Error running parser script:', e);
}
