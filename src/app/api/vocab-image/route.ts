import { NextResponse } from "next/server";
import { getVocabImage } from "@/lib/vocab-image";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const word = searchParams.get("word");
    const example = searchParams.get("example") || undefined;
    const definition = searchParams.get("definition") || undefined;

    if (!word || !word.trim()) {
      return NextResponse.json({ error: "Missing word parameter" }, { status: 400 });
    }

    const { imageUrl, images, keyword } = await getVocabImage(word, example, definition);

    return NextResponse.json(
      { image: imageUrl, imageUrl, images: images || [], keyword },
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
