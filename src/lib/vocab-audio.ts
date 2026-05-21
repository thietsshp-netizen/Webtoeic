// Shared vocabulary audio player with caching, overlapping prevention, and browser TTS fallback
const audioCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let currentRequestTimestamp = 0;

export const speakVocab = async (text: string, type: 'us' | 'uk' = 'us') => {
  if (typeof window === 'undefined') return;

  const requestTimestamp = Date.now();
  currentRequestTimestamp = requestTimestamp;

  // Stop any active audio and cancel active TTS
  if (activeAudio) {
    try {
      activeAudio.pause();
    } catch (e) {
      console.warn('[Vocab Audio] Failed to pause active audio:', e);
    }
    activeAudio = null;
  }
  
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Remove content inside parentheses (e.g. part of speech tag: "Bicyclist (n)" -> "Bicyclist")
  const cleanSpeechText = text.replace(/\s*\([^)]*\)/g, '').trim();

  const fallbackSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (requestTimestamp !== currentRequestTimestamp) return; // Prevent stale speech
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = type === 'uk' ? 'en-GB' : 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // If text is a sentence or phrase with multiple words, use TTS immediately
  if (cleanSpeechText.includes(' ')) {
    fallbackSpeak();
    return;
  }

  const cleanWord = cleanSpeechText.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cacheKey = `${cleanWord}_${type}`;

  // Check cache first
  if (audioCache.has(cacheKey)) {
    const cachedUrl = audioCache.get(cacheKey)!;
    if (requestTimestamp !== currentRequestTimestamp) return; // Prevent stale speech
    if (cachedUrl === 'tts') {
      fallbackSpeak();
    } else {
      const audio = new Audio(cachedUrl);
      activeAudio = audio;
      audio.play().catch(() => fallbackSpeak());
    }
    return;
  }

  const folder = type === 'us' ? 'ame' : 'bre';
  const legacySuffix = type === 'us' ? '__us_1' : '__gb_1';

  const urls = [
    `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}.mp3`,
    `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}1.mp3`,
    `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}2.mp3`,
    `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}${legacySuffix}.mp3`
  ];

  const controller = new AbortController();
  const signal = controller.signal;

  try {
    const checkPromises = urls.map(async (url, index) => {
      try {
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 1000)
        );
        const fetchPromise = fetch(url, { method: 'HEAD', signal });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        if (response && response.status === 200) {
          return { index, url, exists: true };
        }
        return { index, url, exists: false };
      } catch {
        return { index, url, exists: false };
      }
    });

    const results = await Promise.all(checkPromises);
    
    // Check if a newer request has been made while waiting for parallel HEAD requests
    if (requestTimestamp !== currentRequestTimestamp) {
      controller.abort();
      return;
    }

    const validResults = results
      .filter(r => r.exists)
      .sort((a, b) => a.index - b.index);

    if (validResults.length > 0) {
      const bestUrl = validResults[0].url;
      audioCache.set(cacheKey, bestUrl);
      
      if (requestTimestamp !== currentRequestTimestamp) return; // Prevent stale speech
      
      const audio = new Audio(bestUrl);
      activeAudio = audio;
      audio.play().catch(() => {
        if (requestTimestamp === currentRequestTimestamp) {
          fallbackSpeak();
        }
      });
    } else {
      audioCache.set(cacheKey, 'tts');
      fallbackSpeak();
    }
  } catch (err) {
    console.warn('[Vocab Audio] Parallel check failed, falling back to TTS:', err);
    if (requestTimestamp === currentRequestTimestamp) {
      fallbackSpeak();
    }
  } finally {
    controller.abort();
  }
};
