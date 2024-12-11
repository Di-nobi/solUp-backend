import crypto from 'crypto';
import dotenv from "dotenv";

dotenv.config();

const algorithm = 'aes-256-cbc'; 
const secretKey = process.env.ENCRYPTION_PASSWORD;
if (!secretKey) {
    throw new Error('Encryption key not set');
}

const key = crypto.createHash('sha256').update(String(secretKey)).digest('base64').substr(0, 32);
const ivLen = 16;

export const encrypt = (text: string):  { iv: string, encryptedData: string } => {
    const iv = crypto.randomBytes(ivLen);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
}

export const decrypt = (iv: string, encryptedData: string): string => {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);
    return decrypted.toString();
}