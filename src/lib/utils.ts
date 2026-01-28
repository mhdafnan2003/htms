import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign({ ...payload }, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as any
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateId(prefix: string, lastId?: string): string {
  if (!lastId) {
    return `${prefix}-0001`;
  }

  const lastNumber = parseInt(lastId.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REC-${timestamp}${random}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

export function calculateAttendancePercentage(presentDays: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
}