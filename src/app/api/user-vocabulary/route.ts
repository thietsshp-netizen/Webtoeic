import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Fetch user's saved vocabulary
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";

    // Fetch dictionary/starred vocabulary
    const dictVocabs = await (prisma as any).userVocabulary.findMany({
      where: all ? { userId: userId } : { userId: userId, isStarred: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(dictVocabs.map((v: any) => ({
      ...v,
      source: 'dictionary'
    })));
  } catch (error: any) {
    console.error('[UserVocab API GET] Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Save or Unsave a word meaning
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      word, partOfSpeech, definition, translation, ipa, 
      example, exampleTranslation, action,
      synonyms, antonyms, collocations, wordFamily
    } = body;

    if (!word || !definition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await (prisma as any).userVocabulary.findFirst({
      where: {
        userId: userId,
        word: { equals: word.trim(), mode: 'insensitive' },
        // Simplify: Just match the word and userId to avoid definition mismatch issues
      },
    });

    if (action === 'toggle-unlearned') {
      if (existing) {
        const updated = await (prisma as any).userVocabulary.update({
          where: { id: existing.id },
          data: { isUnlearned: !existing.isUnlearned }
        });
        // Cleanup if both flags are false
        if (!updated.isStarred && !updated.isUnlearned) {
          await (prisma as any).userVocabulary.delete({ where: { id: updated.id } });
          return NextResponse.json({ action: 'deleted' });
        }
        return NextResponse.json(updated);
      } else {
        // Create new record just for unlearned
        const created = await (prisma as any).userVocabulary.create({
          data: {
            userId, word, definition,
            ipa, example, exampleTranslation,
            synonyms, antonyms, collocations, wordFamily,
            isStarred: false,
            isUnlearned: true
          }
        });
        return NextResponse.json(created);
      }
    }

    if (action === 'delete') {
      if (existing) {
        const updated = await (prisma as any).userVocabulary.update({
          where: { id: existing.id },
          data: { isStarred: false }
        });
        if (!updated.isStarred && !updated.isUnlearned) {
          await (prisma as any).userVocabulary.delete({ where: { id: updated.id } });
          return NextResponse.json({ action: 'deleted' });
        }
        return NextResponse.json(updated);
      }
      return NextResponse.json({ success: true });
    }

    if (existing) {
      // If saving and already exists, only update isStarred and isUnlearned flags to preserve old definition/examples
      const updated = await (prisma as any).userVocabulary.update({
        where: { id: existing.id },
        data: { 
          isStarred: true,
          isUnlearned: true // Reset to unlearned when re-starred
        }
      });
      return NextResponse.json(updated);
    }

    const newVocab = await (prisma as any).userVocabulary.create({
      data: {
        userId: userId,
        word: word.trim(),
        partOfSpeech,
        definition: definition.trim(),
        translation: translation?.trim() || definition.trim(),
        ipa,
        example,
        exampleTranslation,
        synonyms,
        antonyms,
        collocations,
        wordFamily,
        isStarred: true,
        isUnlearned: true // Default to true when newly starred
      },
    });

    return NextResponse.json(newVocab);
  } catch (error: any) {
    const msg = error?.message || String(error) || 'Unknown error';
    console.error('[UserVocab API] Error processing:', msg);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: msg,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
