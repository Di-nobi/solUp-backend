import crypto from 'crypto';
import dotenv from "dotenv";

dotenv.config();


// Configuration for encryption
const algorithm = 'aes-256-cbc'; 
const envPassword = process.env.ENCRYPTION_PASSWORD // Key should be securely stored and reused
const iv = crypto.randomBytes(16); // Initialization vector

// Derive a key from the password
const deriveKey = (password: string): Buffer => {
    return crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha256');
  };

// Encrypt function
export const encryptReferralCode = (data: string): string => {
    const key = deriveKey(envPassword!);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  };

// Decrypt function with password parameter
// export const decryptReferralCode = (encryptedData: string, password: string): string | null => {
//     const key = deriveKey(password);
//     const [ivHex, encryptedText] = encryptedData.split(':');
//     const iv = Buffer.from(ivHex, 'hex');
//     const encryptedBuffer = Buffer.from(encryptedText, 'hex');
//     try {
//       const decipher = crypto.createDecipheriv(algorithm, key, iv);
//       let decrypted = decipher.update(encryptedBuffer, 'hex', 'utf8');
//       decrypted += decipher.final('utf8');
//       return decrypted;
//     } catch (error) {
//       // Decryption failed
//       return null;
//     }
//   };

// Generate referral code with encryption
export const generateReferralCode = (email: string, userId: string, timestamp: number): string => {
  const seed = `${email}-${userId}-${timestamp}`;
  return encryptReferralCode(seed);
};