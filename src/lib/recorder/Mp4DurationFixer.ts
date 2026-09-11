/* src/lib/recorder/Mp4DurationFixer.ts */

/**
 * Tiện ích đọc và vá thông số thời lượng (Duration & Moov Header Box) cho file MP4 (ISOBMFF)
 * Giúp video MP4 được tạo ra bởi trình duyệt hiển thị:
 * 1. Thumbnail ảnh bài giảng trong macOS Finder (QuickLook)
 * 2. Xem trước được bằng phím Spacebar trên Mac
 * 3. Hiển thị đầy đủ thanh tiến độ thời lượng (00:00 / MM:SS) trong QuickTime Player, Safari, iOS
 */

function readBoxType(view: DataView, offset: number): string {
  let type = "";
  for (let i = 0; i < 4; i++) {
    type += String.fromCharCode(view.getUint8(offset + 4 + i));
  }
  return type;
}

function parseAndPatchMoov(buffer: Uint8Array, durationMs: number): boolean {
  if (buffer.length < 16) return false;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  let movieTimescale = 1000;
  let hasPatched = false;

  // Đệ quy quét các hộp (Boxes / Atoms) trong file MP4
  function scanBoxes(startOffset: number, endOffset: number) {
    let offset = startOffset;

    while (offset + 8 <= endOffset) {
      const boxSize = view.getUint32(offset);
      const boxType = readBoxType(view, offset);

      const actualSize = boxSize === 1 
        ? Number(view.getBigUint64(offset + 8)) 
        : (boxSize === 0 ? endOffset - offset : boxSize);

      if (actualSize < 8 || offset + actualSize > endOffset) {
        break;
      }

      const contentStart = offset + (boxSize === 1 ? 16 : 8);
      const boxEnd = offset + actualSize;

      if (boxType === "moov" || boxType === "trak" || boxType === "mdia" || boxType === "minf" || boxType === "mvex") {
        // Container box -> quét sâu vào bên trong
        scanBoxes(contentStart, boxEnd);
      } else if (boxType === "mvhd") {
        // Movie Header Box: chứa movie timescale và duration tổng thể
        const version = view.getUint8(contentStart);
        if (version === 0 && contentStart + 20 <= boxEnd) {
          movieTimescale = view.getUint32(contentStart + 12);
          if (movieTimescale > 0) {
            const durationUnits = Math.max(1, Math.round((durationMs * movieTimescale) / 1000));
            view.setUint32(contentStart + 16, durationUnits);
            hasPatched = true;
          }
        } else if (version === 1 && contentStart + 28 <= boxEnd) {
          movieTimescale = view.getUint32(contentStart + 20);
          if (movieTimescale > 0) {
            const durationUnits = BigInt(Math.max(1, Math.round((durationMs * movieTimescale) / 1000)));
            view.setBigUint64(contentStart + 24, durationUnits);
            hasPatched = true;
          }
        }
      } else if (boxType === "tkhd") {
        // Track Header Box: thời lượng của track tính theo movieTimescale
        const version = view.getUint8(contentStart);
        if (version === 0 && contentStart + 24 <= boxEnd) {
          if (movieTimescale > 0) {
            const durationUnits = Math.max(1, Math.round((durationMs * movieTimescale) / 1000));
            view.setUint32(contentStart + 20, durationUnits);
            hasPatched = true;
          }
        } else if (version === 1 && contentStart + 36 <= boxEnd) {
          if (movieTimescale > 0) {
            const durationUnits = BigInt(Math.max(1, Math.round((durationMs * movieTimescale) / 1000)));
            view.setBigUint64(contentStart + 28, durationUnits);
            hasPatched = true;
          }
        }
      } else if (boxType === "mdhd") {
        // Media Header Box: thời lượng riêng của từng track (video / audio)
        const version = view.getUint8(contentStart);
        if (version === 0 && contentStart + 20 <= boxEnd) {
          const trackTimescale = view.getUint32(contentStart + 12);
          if (trackTimescale > 0) {
            const durationUnits = Math.max(1, Math.round((durationMs * trackTimescale) / 1000));
            view.setUint32(contentStart + 16, durationUnits);
            hasPatched = true;
          }
        } else if (version === 1 && contentStart + 28 <= boxEnd) {
          const trackTimescale = view.getUint32(contentStart + 20);
          if (trackTimescale > 0) {
            const durationUnits = BigInt(Math.max(1, Math.round((durationMs * trackTimescale) / 1000)));
            view.setBigUint64(contentStart + 24, durationUnits);
            hasPatched = true;
          }
        }
      } else if (boxType === "mehd") {
        // Movie Extends Header Box: thời lượng phân mảnh fMP4
        const version = view.getUint8(contentStart);
        if (version === 0 && contentStart + 8 <= boxEnd) {
          const durationUnits = Math.max(1, Math.round((durationMs * movieTimescale) / 1000));
          view.setUint32(contentStart + 4, durationUnits);
          hasPatched = true;
        } else if (version === 1 && contentStart + 12 <= boxEnd) {
          const durationUnits = BigInt(Math.max(1, Math.round((durationMs * movieTimescale) / 1000)));
          view.setBigUint64(contentStart + 4, durationUnits);
          hasPatched = true;
        }
      }

      offset += actualSize;
    }
  }

  scanBoxes(0, buffer.length);
  return hasPatched;
}

/**
 * Vá thời lượng chính xác vào file Blob MP4
 * @param blob File video MP4 từ MediaRecorder
 * @param durationMs Tổng thời lượng đã quay (tính bằng mili-giây)
 */
export async function fixMp4Duration(blob: Blob, durationMs: number): Promise<Blob> {
  if (!blob || blob.size === 0 || durationMs <= 0) {
    return blob;
  }

  try {
    // Đọc phần header đầu tiên (~512KB) nơi chứa ftyp và moov box
    const headerSize = Math.min(blob.size, 512 * 1024);
    const headerSlice = blob.slice(0, headerSize);
    const arrayBuffer = await headerSlice.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const success = parseAndPatchMoov(uint8Array, durationMs);
    if (success) {
      // Ghép header đã vá vào phần thân dữ liệu còn lại
      const remainingSlice = blob.slice(headerSize);
      return new Blob([uint8Array, remainingSlice], { type: blob.type || "video/mp4" });
    }
  } catch (err) {
    console.warn("[Mp4DurationFixer] Failed to patch MP4 duration:", err);
  }

  return blob;
}

/**
 * Vá thời lượng trực tiếp vào file stream trên đĩa (Direct-to-Disk)
 * @param fileHandle FileHandle từ File System Access API
 * @param durationMs Tổng thời lượng đã quay (mili-giây)
 */
export async function patchFileHandleDuration(fileHandle: any, durationMs: number): Promise<void> {
  if (!fileHandle || durationMs <= 0 || typeof fileHandle.getFile !== "function") {
    return;
  }

  try {
    const file = await fileHandle.getFile();
    const headerSize = Math.min(file.size, 512 * 1024);
    if (headerSize === 0) return;

    const slice = file.slice(0, headerSize);
    const arrayBuffer = await slice.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const success = parseAndPatchMoov(uint8Array, durationMs);
    if (success && typeof fileHandle.createWritable === "function") {
      const writable = await fileHandle.createWritable({ keepExistingData: true });
      await writable.write({ type: "write", position: 0, data: uint8Array });
      await writable.close();
    }
  } catch (err) {
    console.warn("[Mp4DurationFixer] Direct file duration patch failed:", err);
  }
}
