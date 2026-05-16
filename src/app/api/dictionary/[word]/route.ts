import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ word: string }> }
) {
  const startTime = Date.now();
  try {
    const { word: rawWord } = await params;
    const word = rawWord.toLowerCase().trim().replace(/’/g, "'");

    if (!word) {
      return NextResponse.json({ error: 'Invalid word' }, { status: 400 });
    }

    console.log(`[Dictionary API] Searching for: "${word}"`);

    // DIAGNOSTIC: Check if we can see any words
    const totalCount = await prisma.dictionary.count();
    console.log(`[Dictionary API] Total words seen by Prisma: ${totalCount}`);

    // 1. Smart word normalization & root finding
    const searchTerms = [word];
    if (word.endsWith("'s")) searchTerms.push(word.slice(0, -2));
    if (word.endsWith("s") && !word.endsWith("ss")) searchTerms.push(word.slice(0, -1));
    if (word.endsWith("es")) searchTerms.push(word.slice(0, -2));
    if (word.endsWith("ed")) {
      searchTerms.push(word.slice(0, -2));
      searchTerms.push(word.slice(0, -1)); // baked -> bake
    }
    if (word.endsWith("ing")) {
      searchTerms.push(word.slice(0, -3));
      searchTerms.push(word.slice(0, -3) + "e"); // making -> make
    }
    if (word.endsWith("ies")) {
      searchTerms.push(word.slice(0, -3) + "y"); // agencies -> agency
    }
    if (word.endsWith("ly")) searchTerms.push(word.slice(0, -2));

    const uniqueTerms = [...new Set(searchTerms.filter(t => t.length > 1))];

    // Fetch potential matches using OR for maximum compatibility with mode: 'insensitive'
    const entries = await prisma.dictionary.findMany({
      where: { 
        OR: uniqueTerms.map(t => ({
          word: {
            equals: t,
            mode: 'insensitive'
          }
        }))
      },
    });

    // Pick the best match: Exact first, then longest match
    let entry = entries.find(e => e.word.toLowerCase() === word);
    if (!entry && entries.length > 0) {
      entry = entries.sort((a, b) => b.word.length - a.word.length)[0];
    }

    if (!entry) {
      console.log(`[Dictionary API] Word NOT FOUND: "${word}"`);
      
      // Still fetch similar words even if the target is missing
      let similarWords: string[] = [];
      
      // Better root finding for suggestions: strip all known suffixes
      let root = word.replace(/('s|s|es|ies|ed|ing|ly)$/, '');
      if (root.length < 3) root = word.substring(0, 3);

      const suggestions = await prisma.dictionary.findMany({
        where: {
          word: {
            startsWith: root,
            mode: 'insensitive',
          },
        },
        take: 12,
        select: { word: true },
        orderBy: { word: 'asc' }
      });
      similarWords = suggestions.map(s => s.word);

      return NextResponse.json({ 
        word: word,
        error: 'Word not found', 
        similarWords: similarWords,
        debugCount: totalCount,
        v: 2.2
      }, { status: 200 });
    }

    // 2. Fetch similar words with much smarter logic
    let similarWords: string[] = [];
    
    // Strategy A: Use Word Family from the entry itself (Verify they exist in DB)
    const entryData = entry.data as any;
    const candidates: string[] = [];
    
    // Collect potential words from word family (meanings + top level)
    const rawFamily = [
      ...(entryData?.meanings?.flatMap((m: any) => m.word_family || []) || []),
      ...(entryData?.word_family || [])
    ].map((f: any) => f.word.replace(/\s*\(.*?\)\s*$/, '').trim());

    if (rawFamily.length > 0) {
      // CRITICAL: Check if these words actually exist in our Dictionary table
      const existingFamily = await prisma.dictionary.findMany({
        where: {
          word: {
            in: rawFamily,
            mode: 'insensitive'
          }
        },
        select: { word: true }
      });
      candidates.push(...existingFamily.map(e => e.word));
    }

    // Clean and deduplicate candidates
    similarWords = [...new Set(
      candidates.filter(w => w.toLowerCase() !== word.toLowerCase() && w.length > 1)
    )];

    // Strategy B: If few family words, try to find root by stripping common suffixes
    if (similarWords.length < 5) {
      let root = word.replace(/('s|s|es|ies|ed|ing|ly)$/, '');

      if (root !== word && root.length >= 3) {
        const rootMatches = await prisma.dictionary.findMany({
          where: {
            word: {
              startsWith: root,
              mode: 'insensitive',
              not: word,
            },
          },
          take: 10,
          select: { word: true },
        });
        const rootWords = rootMatches.map(rm => rm.word);
        similarWords = [...new Set([...similarWords, ...rootWords])];
      }
    }

    // Final fallback: Prefix search (Increased to 5 chars for better relevance)
    if (similarWords.length < 5 && word.length >= 5) {
      const fallbackMatches = await prisma.dictionary.findMany({
        where: {
          word: {
            startsWith: word.substring(0, 5),
            mode: 'insensitive',
            not: { in: [word, ...similarWords] },
          },
        },
        take: 10,
        select: { word: true },
      });
      similarWords = [...new Set([...similarWords, ...fallbackMatches.map(m => m.word)])];
    }

    // 3. Ensure data is an object (not a string) for the frontend
    let finalData = entry.data;
    if (typeof finalData === 'string') {
      try {
        finalData = JSON.parse(finalData);
      } catch (e) {
        console.error("[Dictionary API] Failed to parse entry data string", e);
      }
    }

    console.log(`[Dictionary API] Success: "${word}" in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      ...entry,
      data: finalData,
      similarWords: similarWords,
      debugCount: totalCount,
      v: 2.2
    });
  } catch (error) {
    console.error(`[Dictionary API] Error searching for word in ${Date.now() - startTime}ms:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
