import crypto from 'node:crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };
const SEP = ':';

/**
 * Gera hash da senha com scrypt (Node crypto).
 * Formato: salt:hash (hex)
 */
export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(plainPassword, salt, KEY_LENGTH, SCRYPT_OPTIONS).toString('hex');
  return `${salt}${SEP}${hash}`;
}

/**
 * Verifica se a senha confere com o hash armazenado.
 */
export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;
  const idx = storedHash.indexOf(SEP);
  if (idx === -1) return false;
  const salt = storedHash.slice(0, idx);
  const expectedHash = storedHash.slice(idx + 1);
  const derived = crypto.scryptSync(plainPassword, salt, KEY_LENGTH, SCRYPT_OPTIONS).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(derived, 'hex'));
}
