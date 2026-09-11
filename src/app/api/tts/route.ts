/* src/app/api/tts/route.ts */

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawText = searchParams.get('text') || '';
    const type = (searchParams.get('type') || 'us').toLowerCase();

    const cleanText = rawText.trim().replace(/\s+/g, ' ');
    if (!cleanText) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    // Giới hạn độ dài an toàn cho từ vựng và cụm từ ngắn
    const targetText = cleanText.slice(0, 300);
    const lang = type === 'uk' ? 'en-GB' : 'en-US';

    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(targetText)}&tl=${lang}&client=tw-ob`;

    const upstreamResponse = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json({ error: 'Upstream TTS error' }, { status: 502 });
    }

    const audioBuffer = await upstreamResponse.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('[TTS API] Failed to stream TTS audio:', error);
    return NextResponse.json({ error: 'Internal TTS Server Error' }, { status: 500 });
  }
}
