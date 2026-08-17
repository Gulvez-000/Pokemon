import crypto from 'crypto';

const PEPPER = process.env.SESSION_SECRET || 'cambia-esto';

export function hashDni(dni) {
  return crypto.createHash('sha256').update(PEPPER + ':' + dni).digest('hex');
}
