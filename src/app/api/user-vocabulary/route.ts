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
    const deckId = searchParams.get("deckId");

    const whereClause: any = { userId: userId };
    if (!all) {
      whereClause.isStarred = true;
    }
    
    if (deckId) {
      if (deckId === 'uncategorized') {
        whereClause.deckId = null;
      } else {
        whereClause.deckId = deckId;
      }
    }

    // Fetch dictionary/starred vocabulary
    const dictVocabs = await (prisma as any).userVocabulary.findMany({
      where: whereClause,
      include: { deck: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(dictVocabs.map((v: any) => ({
      ...v,
      deck: v.deck,
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
      synonyms, antonyms, collocations, wordFamily, deckId
    } = body;

    if (!word || !definition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await (prisma as any).userVocabulary.findFirst({
      where: {
        userId: userId,
        word: { equals: word.trim(), mode: 'insensitive' },
        definition: { equals: definition.trim(), mode: 'insensitive' }
      },
    });

    if (action === 'update-deck') {
      if (existing) {
        const updated = await (prisma as any).userVocabulary.update({
          where: { id: existing.id },
          data: {
            deckId: (deckId && deckId !== 'uncategorized') ? deckId : null
          },
          include: { deck: true }
        });
        return NextResponse.json({ ...updated, deck: updated.deck });
      }
      return NextResponse.json({ error: 'Từ vựng chưa được gắn sao' }, { status: 404 });
    }

    if (action === 'toggle-unlearned') {
      if (existing) {
        const updated = await (prisma as any).userVocabulary.update({
          where: { id: existing.id },
          data: { isUnlearned: !existing.isUnlearned },
          include: { deck: true }
        });
        // Cleanup if both flags are false
        if (!updated.isStarred && !updated.isUnlearned) {
          await (prisma as any).userVocabulary.delete({ where: { id: updated.id } });
          return NextResponse.json({ action: 'deleted' });
        }
        return NextResponse.json({ ...updated, deck: updated.deck });
      } else {
        // Create new record just for unlearned
        const created = await (prisma as any).userVocabulary.create({
          data: {
            userId, word, definition,
            ipa, example, exampleTranslation,
            synonyms, antonyms, collocations, wordFamily,
            isStarred: false,
            isUnlearned: true,
            deckId: (deckId && deckId !== 'uncategorized') ? deckId : null
          },
          include: { deck: true }
        });
        return NextResponse.json({ ...created, deck: created.deck });
      }
    }

    if (action === 'delete') {
      if (existing) {
        const updated = await (prisma as any).userVocabulary.update({
          where: { id: existing.id },
          data: { isStarred: false },
          include: { deck: true }
        });
        if (!updated.isStarred && !updated.isUnlearned) {
          await (prisma as any).userVocabulary.delete({ where: { id: updated.id } });
          return NextResponse.json({ action: 'deleted' });
        }
        return NextResponse.json({ ...updated, deck: updated.deck });
      }
      return NextResponse.json({ success: true });
    }

    if (existing) {
      // If saving and already exists, update flags and potentially update the deckId
      const updateData: any = { 
        isStarred: true,
        isUnlearned: true // Reset to unlearned when re-starred
      };
      if (deckId !== undefined) {
        updateData.deckId = (deckId && deckId !== 'uncategorized') ? deckId : null;
      }
      const updated = await (prisma as any).userVocabulary.update({
        where: { id: existing.id },
        data: updateData,
        include: { deck: true }
      });
      return NextResponse.json({ ...updated, deck: updated.deck });
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
        isUnlearned: true, // Default to true when newly starred
        deckId: (deckId && deckId !== 'uncategorized') ? deckId : null
      },
      include: { deck: true }
    });

    return NextResponse.json({ ...newVocab, deck: newVocab.deck });
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
