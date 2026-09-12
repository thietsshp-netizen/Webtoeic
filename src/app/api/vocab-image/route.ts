import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "up", "about", "into", "through", "during", "after", "before", "over", "under", "between", "among",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "will", "would", "shall", "should", "can", "could", "may", "might", "must",
  "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "its", "our", "their", "this", "that", "these", "those", "me", "him", "us", "them", "who", "whom", "whose", "which", "what",
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "much", "many",
  "serving", "please", "yesterday", "tomorrow", "today", "new", "old", "good", "bad", "get", "got", "just", "like", "also", "along", "well", "walk", "walked", "walking", "went", "go", "going", "goes",
  "see", "saw", "seen", "seeing", "make", "made", "making", "take", "took", "taken", "taking", "come", "came", "coming", "look", "looks", "looked", "looking"
]);

// Filters out non-photographic junk (PDF scans, document pages, solid backgrounds, textures, microscopy, logos)
const JUNK_IMAGE_PATTERNS = [
  /\.pdf/i, /\.djvu/i, /\.tif/i, /\.svg/i, /document/i, /scan/i, /page/i, /report/i, /text/i,
  /chronology/i, /annual/i, /diagram/i, /chart/i, /graph/i, /map/i, /coat_of_arms/i, /flag/i,
  /solid/i, /texture/i, /microscopy/i, /monochrome/i, /abstract/i, /pattern/i, /surface/i, /background/i,
  /stamps/i, /manuscript/i, /paper/i, /letter/i
];

function isJunkImage(url?: string | null, title?: string | null): boolean {
  if (!url) return true;
  const combined = `${url} ${title || ""}`.toLowerCase();
  return JUNK_IMAGE_PATTERNS.some(pat => pat.test(combined));
}

function extractKeywords(word: string, example?: string, definition?: string): { cleanWord: string; contextTokens: string[] } {
  const cleanWord = word.toLowerCase().trim();
  const tokens: string[] = [];

  if (example) {
    const cleanEx = example.replace(/<[^>]*>/g, "").replace(/[^a-zA-Z\s]/g, " ");
    const words = cleanEx
      .split(/\s+/)
      .map(w => w.toLowerCase().trim())
      .filter(w => w && !STOPWORDS.has(w) && w.length > 2 && w !== cleanWord);
    tokens.push(...words);
  }

  if (tokens.length === 0 && definition) {
    const cleanDef = definition.replace(/[^a-zA-Z\s]/g, " ");
    const words = cleanDef
      .split(/\s+/)
      .map(w => w.toLowerCase().trim())
      .filter(w => w && !STOPWORDS.has(w) && w.length > 2 && w !== cleanWord);
    tokens.push(...words);
  }

  return { cleanWord, contextTokens: tokens.slice(0, 2) };
}

// 1. Openverse: High quality real-world photographs & illustrations
async function searchOpenverse(query: string): Promise<string | null> {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&categories=photograph&aspect_ratio=wide,square&page_size=4`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WebtoeicApp/1.0 (contact@hoctoeic.com)" },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const data = await res.json();
    for (const item of (data.results || [])) {
      const imgUrl = item.thumbnail || item.url;
      if (imgUrl && !isJunkImage(imgUrl, item.title)) {
        return imgUrl;
      }
    }
  } catch (e) {
    // Fail silently
  }
  return null;
}

// 2. Wikipedia Lead Photos: Relevant encyclopedic article photos
async function searchWikipediaArticle(query: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages&pithumbsize=500&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WebtoeicApp/1.0 (contact@hoctoeic.com)" },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query ? Object.values(data.query.pages) : [];
    for (const page of pages as any[]) {
      if (page.thumbnail?.source && !isJunkImage(page.thumbnail.source, page.title)) {
        return page.thumbnail.source;
      }
    }
  } catch (e) {
    // Fail silently
  }
  return null;
}

// 3. Wikimedia Commons Filtered (Bitmap only, excluding document scans)
async function searchWikimediaFiltered(query: string): Promise<string | null> {
  try {
    const searchQuery = `${query} filetype:bitmap`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=5&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=500&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WebtoeicApp/1.0 (contact@hoctoeic.com)" },
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json = await res.json();
    const pages = json.query ? Object.values(json.query.pages) : [];
    for (const page of pages as any[]) {
      const img = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
      if (img && !isJunkImage(img, page.title)) {
        return img;
      }
    }
  } catch (err) {
    // Fail silently
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const word = searchParams.get("word");
    const example = searchParams.get("example") || undefined;
    const definition = searchParams.get("definition") || undefined;

    if (!word || !word.trim()) {
      return NextResponse.json({ error: "Missing word parameter" }, { status: 400 });
    }

    const { cleanWord, contextTokens } = extractKeywords(word, example, definition);
    let imageUrl: string | null = null;
    let queryUsed = cleanWord;

    // Step 1: Try Openverse with Context (e.g. 'looks corporate headquarters' or 'bank river')
    if (contextTokens.length > 0) {
      queryUsed = `${cleanWord} ${contextTokens.join(" ")}`;
      imageUrl = await searchOpenverse(queryUsed);
    }

    // Step 2: Try Openverse with target word alone (e.g. 'flight', 'apple')
    if (!imageUrl) {
      queryUsed = cleanWord;
      imageUrl = await searchOpenverse(cleanWord);
    }

    // Step 3: Try Wikipedia Lead Image with target word
    if (!imageUrl) {
      imageUrl = await searchWikipediaArticle(cleanWord);
    }

    // Step 4: Try Wikipedia Lead Image with context
    if (!imageUrl && contextTokens.length > 0) {
      imageUrl = await searchWikipediaArticle(`${cleanWord} ${contextTokens.join(" ")}`);
    }

    // Step 5: Fallback to filtered Wikimedia
    if (!imageUrl) {
      imageUrl = await searchWikimediaFiltered(cleanWord);
    }

    console.log(`[VocabImage] word: "${word}", queryUsed: "${queryUsed}", result: ${imageUrl}`);

    return NextResponse.json(
      { image: imageUrl, imageUrl, keyword: queryUsed },
      {
        headers: {
          "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400"
        }
      }
    );
  } catch (error: any) {
    console.error("[VocabImage API] Error:", error);
    return NextResponse.json({ image: null, imageUrl: null, error: error?.message }, { status: 500 });
  }
}
