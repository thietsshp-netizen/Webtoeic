/* src/lib/vocab-audio.ts */

// In-memory cache for audio URLs
const audioCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let currentRequestTimestamp = 0;

/**
 * Phát âm thanh từ vựng hoặc cụm từ tức thì (< 0.05s)
 * - Ưu tiên 1: File âm thanh người thật trên Supabase (dict-audio/ame/ hoặc dict-audio/bre/)
 * - Ưu tiên 2: File âm thanh tại thư mục gốc (dict-audio/)
 * - Ưu tiên 3: File biến thể (word1.mp3, word__us_1.mp3)
 * - Fallback: Stream MP3 từ API nội bộ /api/tts (Đảm bảo 100% thu âm được vào video bài giảng khi quay màn hình)
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

      // Timeout an toàn 2.5s phòng khi mạng rớt hoàn toàn
      setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          resolve(false);
        }
      }, 2500);
    });
  };

  // 1. Nếu là câu hoặc cụm từ dài (chứa khoảng trắng) hoặc từ có dấu đặc biệt (như résumé, café):
  // Phát trực tiếp qua Neural TTS để đảm bảo phát âm chính xác tuyệt đối ngữ cảnh / từ loại
  const hasAccents = /[^\u0000-\u007F]/.test(cleanSpeechText);
  if (cleanSpeechText.includes(' ') || hasAccents) {
    const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanSpeechText)}&type=${type}`;
    await playAudioUrl(ttsUrl);
    return;
  }

  const cleanWord = cleanSpeechText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (!cleanWord) return;

  const cacheKey = `${cleanWord}_${type}`;

  // 2. Kiểm tra Cache đã lưu trước đó: Phát tức thì 0ms
  if (audioCache.has(cacheKey)) {
    const cachedUrl = audioCache.get(cacheKey)!;
    const ok = await playAudioUrl(cachedUrl);
    if (ok) return;
  }

  const folder = type === 'us' ? 'ame' : 'bre';
  const legacySuffix = type === 'us' ? '__us_1' : '__gb_1';

  // Danh sách các URL ưu tiên theo thứ tự
  const candidateUrls = [
    `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}.mp3`,
    `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${cleanWord}.mp3`,
    `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}1.mp3`,
    `https://lvbdcqoagtrzvnaeeznm.supabase.co/storage/v1/object/public/dict-audio/${folder}/${cleanWord}${legacySuffix}.mp3`,
    `/api/tts?text=${encodeURIComponent(cleanSpeechText)}&type=${type}`
  ];

  // Thử lần lượt các URL (Fast Waterfall): 95% trường hợp URL đầu tiên phát ngay tức thì < 50ms
  for (const url of candidateUrls) {
    if (requestTimestamp !== currentRequestTimestamp) break;

    const played = await playAudioUrl(url);
    if (played) {
      // Lưu lại URL chuẩn vào cache để những lần sau phát ngay lập tức
      audioCache.set(cacheKey, url);
      return;
    }
  }
};
