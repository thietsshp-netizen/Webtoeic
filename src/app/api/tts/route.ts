/* src/app/api/tts/route.ts */

import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// In-memory cache for generated TTS audio buffers
const ttsCache = new Map<string, Buffer>();

async function generateEdgeTtsAudio(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text') || '';
    const type = (searchParams.get('type') || 'us').toLowerCase();

    const cleanText = rawText.trim().replace(/\s+/g, ' ');
    if (!cleanText) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    const cacheKey = `${type}_${cleanText}`;
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

    const voice = type === 'uk' ? 'en-GB-SoniaNeural' : 'en-US-JennyNeural';

    try {
      const audioBuffer = await generateEdgeTtsAudio(cleanText, voice);
      
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
      const googleBuffer = await fallbackGoogleTts(cleanText, type);
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

