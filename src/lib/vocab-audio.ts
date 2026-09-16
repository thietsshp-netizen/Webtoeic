/* src/lib/vocab-audio.ts */

// In-memory cache for audio URLs
const audioCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let currentRequestTimestamp = 0;

/**
 * Phát âm thanh từ vựng hoặc cụm từ tức thì qua Microsoft Edge Neural TTS (/api/tts)
 * Không phụ thuộc vào Supabase Storage, hỗ trợ cache phát tức thì 0ms cho các lần bấm tiếp theo
 */
export const speakVocab = async (text: string, type: 'us' | 'uk' = 'us') => {
  if (typeof window === 'undefined' || !text) return;

  const requestTimestamp = Date.now();
  currentRequestTimestamp = requestTimestamp;

  // Dừng ngay bất kỳ âm thanh nào đang phát trước đó để tránh chồng chéo tiếng
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }

  // Loại bỏ nhãn từ loại trong ngoặc đơn (ví dụ: "Bicyclist (n)" -> "Bicyclist")
  const cleanSpeechText = text.replace(/\s*\([^)]*\)/g, '').trim();
  if (!cleanSpeechText) return;

  // Helper hàm phát audio bằng thẻ HTMLAudioElement
  const playAudioUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (requestTimestamp !== currentRequestTimestamp) {
        resolve(false);
        return;
      }

      const audio = new Audio(url);
      activeAudio = audio;

      let isSettled = false;

      audio.onplaying = () => {
        if (!isSettled) {
          isSettled = true;
          resolve(true);
        }
      };

      audio.onerror = () => {
        if (!isSettled) {
          isSettled = true;
          resolve(false);
        }
      };

      audio.play().catch(() => {
        if (!isSettled) {
          isSettled = true;
          resolve(false);
        }
      });

      // Timeout an toàn 4s phòng khi mạng rớt hoàn toàn
      setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          resolve(false);
        }
      }, 4000);
    });
  };

  const cacheKey = `${type}_${cleanSpeechText.toLowerCase()}`;

  // 1. Kiểm tra Cache URL đã lưu trước đó: Phát tức thì 0ms
  if (audioCache.has(cacheKey)) {
    const cachedUrl = audioCache.get(cacheKey)!;
    const ok = await playAudioUrl(cachedUrl);
    if (ok) return;
  }

  // 2. Phát trực tiếp qua API Neural TTS
  const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanSpeechText)}&type=${type}`;
  const played = await playAudioUrl(ttsUrl);
  if (played) {
    audioCache.set(cacheKey, ttsUrl);
  }
};
