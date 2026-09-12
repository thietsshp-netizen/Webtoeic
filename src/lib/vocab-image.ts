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
  /stamps/i, /manuscript/i, /paper/i, /letter/i, /seal/i, /coin/i, /receipt/i, /signboard/i, /stone/i
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

/**
 * Find immediate adjacent word (collocation) in example sentence
 * e.g. "into Eastern Europe next year" with word "eastern" -> "Eastern Europe"
 */
function findAdjacentPhrase(word: string, example?: string): string | null {
  if (!example) return null;
  const cleanEx = example.replace(/<[^>]*>/g, "").replace(/[^a-zA-Z\s]/g, " ").trim();
  const words = cleanEx.split(/\s+/).map(w => w.trim()).filter(Boolean);
  const targetLower = word.toLowerCase().trim();

  const idx = words.findIndex(w => w.toLowerCase() === targetLower);
  if (idx !== -1) {
    // Check next word
    if (idx + 1 < words.length) {
      const nextWord = words[idx + 1].toLowerCase();
      if (!STOPWORDS.has(nextWord) && nextWord.length > 2) {
        return `${word} ${words[idx + 1]}`;
      }
    }
    // Check previous word
    if (idx - 1 >= 0) {
      const prevWord = words[idx - 1].toLowerCase();
      if (!STOPWORDS.has(prevWord) && prevWord.length > 2) {
        return `${words[idx - 1]} ${word}`;
      }
    }
  }
  return null;
}

// 1. Wikipedia Lead Photos: Relevant encyclopedic article photos
async function searchWikipediaArticle(query: string): Promise<string[]> {
  const images: string[] = [];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=pageimages&pithumbsize=500&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WebtoeicApp/1.0 (contact@hoctoeic.com)" },
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
  } catch (e) {
    // Fail silently
  }
  return images;
}

// 2. Openverse: High quality real-world photographs & illustrations
async function searchOpenverse(query: string): Promise<string[]> {
  const images: string[] = [];
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&categories=photograph&aspect_ratio=wide,square&page_size=6`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WebtoeicApp/1.0 (contact@hoctoeic.com)" },
      cache: "no-store"
    });
    if (!res.ok) return images;
    const data = await res.json();
    for (const item of (data.results || [])) {
      const imgUrl = item.thumbnail || item.url;
      if (imgUrl && !isJunkImage(imgUrl, item.title) && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }
  } catch (e) {
    // Fail silently
  }
  return images;
}

// 3. Wikimedia Commons Filtered (Bitmap only, excluding document scans)
async function searchWikimediaFiltered(query: string): Promise<string[]> {
  const images: string[] = [];
  try {
    const searchQuery = `${query} filetype:bitmap`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=6&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=500&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WebtoeicApp/1.0 (contact@hoctoeic.com)" },
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
  } catch (err) {
    // Fail silently
  }
  return images;
}

export async function getVocabImage(
  word: string,
  example?: string,
  definition?: string
): Promise<{ imageUrl: string | null; images: string[]; keyword: string }> {
  const cleanWord = word.toLowerCase().trim();
  const collectedImages: string[] = [];
  const addImages = (imgs: string[]) => {
    for (const img of imgs) {
      if (img && !collectedImages.includes(img)) {
        collectedImages.push(img);
      }
    }
  };

  // 1. Check concept enhancers (e.g. eastern, western...)
  if (CONCEPT_ENHANCERS[cleanWord]) {
    for (const query of CONCEPT_ENHANCERS[cleanWord]) {
      const wikiImgs = await searchWikipediaArticle(query);
      addImages(wikiImgs);
      if (collectedImages.length >= 4) break;
    }
  }

  // 2. Search Wikipedia with clean target word directly
  if (collectedImages.length < 4) {
    const wikiImgs = await searchWikipediaArticle(cleanWord);
    addImages(wikiImgs);
  }

  // 3. Search Openverse with clean target word directly
  if (collectedImages.length < 5) {
    const openverseImgs = await searchOpenverse(cleanWord);
    addImages(openverseImgs);
  }

  // 4. If adjacent phrase exists in example (e.g. "Eastern Europe"), search that
  const adjacentPhrase = findAdjacentPhrase(cleanWord, example);
  if (adjacentPhrase && collectedImages.length < 6) {
    const adjImgs = await searchWikipediaArticle(adjacentPhrase);
    addImages(adjImgs);
  }

  // 5. Fallback Wikimedia filtered
  if (collectedImages.length < 4) {
    const wmImgs = await searchWikimediaFiltered(cleanWord);
    addImages(wmImgs);
  }

  const finalImages = collectedImages.slice(0, 8);
  const imageUrl = finalImages.length > 0 ? finalImages[0] : null;

  return { imageUrl, images: finalImages, keyword: cleanWord };
}
