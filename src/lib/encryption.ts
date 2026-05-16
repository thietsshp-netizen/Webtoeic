import crypto from 'crypto';

// Nếu file .env chưa thiết lập ENCRYPTION_KEY, dùng chuỗi fallback 32 bytes (Tuyệt đối không dùng trên Production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; 
const IV_LENGTH = 16; 

/**
 * Mã hóa chuỗi String (HTML hoặc JSON Payload) thành chuỗi Hex an toàn.
 */
export function encryptHTML(htmlText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(htmlText);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Giải mã chuỗi Hex trả về nguyên trạng. Trả về thông báo lỗi nếu Key sai hoặc người dùng gian lận.
 */
export function decryptHTML(encryptedText: string): string {
  try {
    const textParts = encryptedText.split(':');
    const ivHex = textParts.shift();
    if (!ivHex) return "";
    
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error("Lỗi giải mã phần nội dung (AES).", error);
    return "<p style='color:red;'>Nội dung khóa học đã được bảo mật. Token bị sai hoặc hệ thống bị lỗi giải mã.</p>";
  }
}
