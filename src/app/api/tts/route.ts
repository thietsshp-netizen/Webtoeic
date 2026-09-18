/* src/app/api/tts/route.ts */

import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT, ProsodyOptions } from 'msedge-tts';
import fs from 'fs';
import path from 'path';

// In-memory cache for generated TTS audio buffers
const ttsCache = new Map<string, Buffer>();

async function generateEdgeTtsAudio(text: string, voice: string, options?: ProsodyOptions): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, options);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      reject(new Error('Edge TTS generation timed out'));
    }, 4000);

    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    audioStream.on('end', () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks));
    });
    audioStream.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function fallbackGoogleTts(text: string, type: string): Promise<ArrayBuffer> {
  const lang = type === 'uk' ? 'en-GB' : 'en-US';
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 300))}&tl=${lang}&client=tw-ob`;

  const response = await fetch(googleTtsUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`Google TTS failed with status ${response.status}`);
  }

  return response.arrayBuffer();
}

// Custom text normalization map for words where TTS engines mispronounce (e.g. heteronyms or accented words)
function normalizeTextForTts(text: string): string {
  if (!text) return text;
  let normalized = text;

  // 1. Accented forms containing é (résumé, résumés, resumé, resumés) - ALWAYS CV noun
  normalized = normalized.replace(/(?:r[eé]sumé|résum[eé])s/gi, 'rez-oo-mays');
  normalized = normalized.replace(/(?:r[eé]sumé|résum[eé])/gi, 'rez-oo-may');

  // 2. Standalone unaccented word 'resume' or 'resumes' (e.g. single flashcard word)
  if (/^\s*resumes?\s*$/i.test(text.trim())) {
    normalized = normalized
      .replace(/^resumes$/i, 'rez-oo-mays')
      .replace(/^resume$/i, 'rez-oo-may');
  }

  // 3. Sentences containing unaccented 'resume' / 'resumes' in CV contexts
  const cvContextPrefixRegex = /\b(a|an|the|your|his|her|my|our|their|its|submit|submits|submitted|submitting|send|sends|sent|fax|faxes|faxed|attach|attaches|attached|update|updates|updated|draft|drafts|drafted|online|job|applicant|applicants|candidate|candidates|employment)\s+(resumes?)\b/gi;
  normalized = normalized.replace(cvContextPrefixRegex, (match, prefix, word) => {
    const replacement = word.toLowerCase().endsWith('s') ? 'rez-oo-mays' : 'rez-oo-may';
    return `${prefix} ${replacement}`;
  });

  const cvContextSuffixRegex = /\b(resumes?)\s+(and|or|to|for|with|is|was|are|were|contained|attached|enclosed|submitted|required)\b/gi;
  normalized = normalized.replace(cvContextSuffixRegex, (match, word, suffix) => {
    const replacement = word.toLowerCase().endsWith('s') ? 'rez-oo-mays' : 'rez-oo-may';
    return `${replacement} ${suffix}`;
  });

  // 4. Pronunciation enhancements for -es words with /ɪz/:
  const esIzWords: Record<string, string> = {
    kisses: 'kiss-iz',
    boxes: 'box-iz',
    watches: 'watch-iz',
    changes: 'change-iz',
    wishes: 'wish-iz',
    matches: 'match-iz',
    judges: 'judge-iz',
    buzzes: 'buzz-iz',
    misses: 'miss-iz',
    passes: 'pass-iz',
    buses: 'bus-iz',
    fixes: 'fix-iz',
  };
  const lowerTrim = text.trim().toLowerCase();
  if (esIzWords[lowerTrim]) {
    return esIzWords[lowerTrim];
  }

  return normalized;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Batch generator helper: generate sample audio files and save to public/grammar/
    if (searchParams.get('generate_samples') === '1') {
      const sampleWords = [
        'kisses', 'boxes', 'watches', 'changes',
        'plays', 'dogs', 'cleans', 'loves'
      ];
      const grammarDir = path.join(process.cwd(), 'public/grammar');
      if (!fs.existsSync(grammarDir)) {
        fs.mkdirSync(grammarDir, { recursive: true });
      }

      const results: Record<string, string> = {};
      for (const word of sampleWords) {
        const ttsText = normalizeTextForTts(word);
        const voice = 'en-US-JennyNeural';
        try {
          const buf = await generateEdgeTtsAudio(ttsText, voice, { rate: '-15%' });
          const filePath = path.join(grammarDir, `${word}.mp3`);
          fs.writeFileSync(filePath, buf);
          results[word] = `/grammar/${word}.mp3`;
        } catch (err) {
          console.warn(`[TTS Batch] Failed for ${word}:`, err);
        }
      }
      return NextResponse.json({ success: true, files: results });
    }

    const rawText = searchParams.get('text') || '';
    const type = (searchParams.get('type') || 'us').toLowerCase();

    const cleanText = rawText.trim().replace(/\s+/g, ' ');
    if (!cleanText) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    const voice = type === 'uk' ? 'en-GB-SoniaNeural' : 'en-US-JennyNeural';
    const ttsText = normalizeTextForTts(cleanText);

    const isSingleWord = !cleanText.includes(' ');
    const prosodyOptions: ProsodyOptions | undefined = isSingleWord ? { rate: '-15%' } : undefined;

    const cacheKey = `${type}_${ttsText}_${isSingleWord ? 'slow' : 'norm'}`;
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      return new Response(new Uint8Array(cached), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': cached.length.toString(),
        },
      });
    }

    try {
      const audioBuffer = await generateEdgeTtsAudio(ttsText, voice, prosodyOptions);
      
      // Also cache to public/grammar if it's a single word
      if (isSingleWord && cleanText.length < 30) {
        try {
          const grammarDir = path.join(process.cwd(), 'public/grammar');
          if (fs.existsSync(grammarDir)) {
            const staticFilePath = path.join(grammarDir, `${cleanText.toLowerCase()}.mp3`);
            fs.writeFileSync(staticFilePath, audioBuffer);
          }
        } catch {}
      }

      // Limit in-memory cache size to ~1,000 items
      if (ttsCache.size > 1000) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) ttsCache.delete(firstKey);
      }
      ttsCache.set(cacheKey, audioBuffer);

      return new Response(new Uint8Array(audioBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    } catch (edgeError) {
      console.warn('[TTS API] Edge TTS failed, using Google TTS fallback:', edgeError);
      const googleBuffer = await fallbackGoogleTts(ttsText, type);
      return new Response(googleBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': googleBuffer.byteLength.toString(),
        },
      });
    }
  } catch (error) {
    console.error('[TTS API] Failed to generate TTS audio:', error);
    return NextResponse.json({ error: 'Internal TTS Server Error' }, { status: 500 });
  }
}

