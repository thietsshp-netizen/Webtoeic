// Stop words to prevent irrelevant query combinations
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "up", "about", "into", "through", "during", "after", "before", "over", "under", "between", "among",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "will", "would", "shall", "should", "can", "could", "may", "might", "must",
  "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "its", "our", "their", "this", "that", "these", "those", "me", "him", "us", "them", "who", "whom", "whose", "which", "what",
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "much", "many",
  "serving", "please", "yesterday", "tomorrow", "today", "new", "old", "good", "bad", "get", "got", "just", "like", "also", "along", "well", "walk", "walked", "walking", "went", "go", "going", "goes",
  "see", "saw", "seen", "seeing", "make", "made", "making", "take", "took", "taken", "taking", "come", "came", "coming", "look", "looks", "looked", "looking"
]);

const JUNK_IMAGE_PATTERNS = [
  /\.pdf/i, /\.djvu/i, /\.tif/i, /\.svg/i, /document/i, /scan/i, /page/i, /report/i, /text/i,
  /plaque/i, /tablet/i, /memorial/i, /inscription/i, /tombstone/i, /engraving/i, /marker/i,
  /chronology/i, /annual/i, /diagram/i, /chart/i, /graph/i, /coat_of_arms/i, /flag/i,
  /solid/i, /texture/i, /microscopy/i, /monochrome/i, /abstract/i, /pattern/i, /surface/i, /background/i,
  /stamps/i, /manuscript/i, /paper/i, /letter/i, /seal/i, /coin/i, /receipt/i, /signboard/i, /stone/i,
  /not_included/i, /not\s+included/i, /batteries_not/i, /editathon/i, /conference/i
];

function isJunkImage(url?: string | null, title?: string | null): boolean {
  if (!url) return true;
  const combined = `${url} ${title || ""}`.toLowerCase();
  return JUNK_IMAGE_PATTERNS.some(pat => pat.test(combined));
}

// Directional & abstract concept enhancers
const CONCEPT_ENHANCERS: Record<string, string[]> = {
  eastern: ["eastern", "eastern europe", "east compass"],
  western: ["western", "western europe", "west compass"],
  northern: ["northern", "northern europe", "north compass"],
  southern: ["southern", "southern europe", "south compass"],
};

// In-memory cache for ultra-fast response on repeat queries
interface CacheEntry {
  data: { imageUrl: string | null; images: string[]; keyword: string };
  timestamp: number;
}
const serverImageCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CACHE_SIZE = 5000;

/**
 * Generate candidate queries (including root/lemmatized forms)
 * e.g. "announces" -> ["announces", "announce"]
 */
function getCandidateWords(word: string): string[] {
  const clean = word.toLowerCase().trim();
  const candidates: string[] = [clean];

  // Plural/Verb 3rd person
  if (clean.endsWith('ies') && clean.length > 4) {
    candidates.push(clean.slice(0, -3) + 'y');
  } else if (clean.endsWith('es') && clean.length > 3) {
    candidates.push(clean.slice(0, -2));
    candidates.push(clean.slice(0, -1)); // announces -> announce
  } else if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 3) {
    candidates.push(clean.slice(0, -1));
  }

  // -ing endings
  if (clean.endsWith('ing') && clean.length > 5) {
    candidates.push(clean.slice(0, -3));
    candidates.push(clean.slice(0, -3) + 'e');
    if (clean.length > 5 && clean[clean.length - 4] === clean[clean.length - 5]) {
      candidates.push(clean.slice(0, -4)); // running -> run
    }
  }

  // -ed endings
  if (clean.endsWith('ed') && clean.length > 4) {
    candidates.push(clean.slice(0, -2));
    candidates.push(clean.slice(0, -1)); // created -> create
    if (clean.length > 5 && clean[clean.length - 3] === clean[clean.length - 4]) {
      candidates.push(clean.slice(0, -3)); // stopped -> stop
    }
  }

  // -ly endings
  if (clean.endsWith('ly') && clean.length > 4) {
    candidates.push(clean.slice(0, -2)); // quickly -> quick
  }

  return Array.from(new Set(candidates)).filter(Boolean);
}

/**
 * Find immediate adjacent word (collocation) in example sentence
 */
function findAdjacentPhrase(word: string, example?: string): string | null {
  if (!example) return null;
  const cleanEx = example.replace(/<[^>]*>/g, "").replace(/[^a-zA-Z\s]/g, " ").trim();
  const words = cleanEx.split(/\s+/).map(w => w.trim()).filter(Boolean);
  const targetLower = word.toLowerCase().trim();

  const idx = words.findIndex(w => w.toLowerCase() === targetLower);
  if (idx !== -1) {
    if (idx + 1 < words.length) {
      const nextWord = words[idx + 1].toLowerCase();
      if (!STOPWORDS.has(nextWord) && nextWord.length > 2) {
        return `${word} ${words[idx + 1]}`;
      }
    }
    if (idx - 1 >= 0) {
      const prevWord = words[idx - 1].toLowerCase();
      if (!STOPWORDS.has(prevWord) && prevWord.length > 2) {
        return `${words[idx - 1]} ${word}`;
      }
    }
  }
  return null;
}

// 1. Fast Wikipedia Pageimage Lead Search with 2s timeout
async function searchWikipediaArticle(query: string): Promise<string[]> {
  const images: string[] = [];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=pageimages&pithumbsize=500&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WebtoeicApp/1.0 (contact@hoctoeic.com)" },
      signal: AbortSignal.timeout(2000),
      cache: "no-store"
    });
    if (!res.ok) return images;
    const data = await res.json();
    const pages = data.query ? Object.values(data.query.pages) : [];
    for (const page of pages as any[]) {
      const source = page.thumbnail?.source;
      if (source && !isJunkImage(source, page.title) && !images.includes(source)) {
        images.push(source);
      }
    }
  } catch {
    // Fail silently on timeout or network error
  }
  return images;
}

// 2. Fast Wikimedia Commons Search with 2s timeout
async function searchWikimediaFiltered(query: string): Promise<string[]> {
  const images: string[] = [];
  try {
    const searchQuery = `${query} filetype:bitmap`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=8&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=500&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WebtoeicApp/1.0 (contact@hoctoeic.com)" },
      signal: AbortSignal.timeout(2000),
      cache: "no-store"
    });
    if (!res.ok) return images;
    const json = await res.json();
    const pages = json.query ? Object.values(json.query.pages) : [];
    for (const page of pages as any[]) {
      const img = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
      if (img && !isJunkImage(img, page.title) && !images.includes(img)) {
        images.push(img);
      }
    }
  } catch {
    // Fail silently on timeout or network error
  }
  return images;
}

export async function getVocabImage(
  word: string,
  example?: string,
  definition?: string
): Promise<{ imageUrl: string | null; images: string[]; keyword: string }> {
  const cleanWord = word.toLowerCase().trim();
  const cacheKey = `${cleanWord}:::${(example || definition || "").toLowerCase().trim()}`;

  // 1. Check in-memory cache
  const cached = serverImageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Build candidate search queries
  const searchQueries: string[] = [];

  // Check concept enhancers
  if (CONCEPT_ENHANCERS[cleanWord]) {
    searchQueries.push(...CONCEPT_ENHANCERS[cleanWord]);
  }

  // Add word candidate variations (root form, e.g. "announces", "announce")
  const candidates = getCandidateWords(cleanWord);
  for (const cand of candidates) {
    if (!searchQueries.includes(cand)) {
      searchQueries.push(cand);
    }
  }

  // Add adjacent phrase if available
  const adjacentPhrase = findAdjacentPhrase(cleanWord, example);
  if (adjacentPhrase && !searchQueries.includes(adjacentPhrase)) {
    searchQueries.push(adjacentPhrase);
  }

  // 3. Execute all searches IN PARALLEL for maximum speed (< 1-1.5s total)
  const searchPromises: Promise<string[]>[] = [];
  for (const q of searchQueries.slice(0, 3)) {
    searchPromises.push(searchWikipediaArticle(q));
    searchPromises.push(searchWikimediaFiltered(q));
  }

  const results = await Promise.allSettled(searchPromises);
  const collectedImages: string[] = [];

  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      for (const img of res.value) {
        if (img && !collectedImages.includes(img)) {
          collectedImages.push(img);
        }
      }
    }
  }

  const finalImages = collectedImages.slice(0, 8);
  const imageUrl = finalImages.length > 0 ? finalImages[0] : null;
  const resultData = { imageUrl, images: finalImages, keyword: cleanWord };

  // 4. Save to cache
  if (serverImageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = serverImageCache.keys().next().value;
    if (firstKey) serverImageCache.delete(firstKey);
  }
  serverImageCache.set(cacheKey, { data: resultData, timestamp: Date.now() });

  return resultData;
}

