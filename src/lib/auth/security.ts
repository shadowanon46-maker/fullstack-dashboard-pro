import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import { nanoid } from "nanoid";
import * as bcrypt from "bcrypt";

// Generate 2FA secret & QR code URL
export function generateTwoFactorSecret(email: string) {
  const issuer = "Fullstack Dashboard";
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  
  return {
    secret: totp.secret.base32,
    otpauthUrl: totp.toString(),
  };
}

// Verify 2FA token
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: "Fullstack Dashboard",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

// Create password reset token
export async function createPasswordResetToken(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return null;

  const resetToken = nanoid(64);
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  await db
    .update(users)
    .set({ resetToken, resetTokenExpiresAt: expiresAt })
    .where(eq(users.id, user.id));

  return resetToken;
}

// Reset password with token
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, token));

  if (
    !user ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt < new Date()
  ) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({
      passwordHash: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  return true;
}

// Enable 2FA for user
export async function enableTwoFactor(userId: number, secret: string) {
  await db
    .update(users)
    .set({ twoFactorSecret: secret, twoFactorEnabled: true })
    .where(eq(users.id, userId));
}

// Disable 2FA for user
export async function disableTwoFactor(userId: number) {
  await db
    .update(users)
    .set({ twoFactorSecret: null, twoFactorEnabled: false })
    .where(eq(users.id, userId));
}

// ==========================================
// Brute-Force Protection
// ==========================================

import { loginAttempts, pending2FASessions } from "../db/schema";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Check if login is allowed (not locked out)
export async function checkLoginAttempts(email: string, _ip: string) {
  const [attempt] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email));

  if (attempt && attempt.lockedUntil && attempt.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (attempt.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new Error(`Too many failed attempts. Try again in ${remainingMinutes} minutes.`);
  }

  return attempt;
}

// Record a failed login attempt
export async function recordFailedAttempt(email: string, ip: string) {
  const [attempt] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email));

  if (attempt) {
    const newAttempts = (attempt.attempts ?? 0) + 1;
    const lockedUntil =
      newAttempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60000)
        : null;

    await db
      .update(loginAttempts)
      .set({
        attempts: newAttempts,
        lockedUntil,
      })
      .where(eq(loginAttempts.id, attempt.id));
  } else {
    await db.insert(loginAttempts).values({ email, ip, attempts: 1 });
  }
}

// Reset login attempts after successful login
export async function resetLoginAttempts(email: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
}

// ==========================================
// Pending 2FA Sessions
// ==========================================

// Create a pending 2FA session
export async function createPending2FASession(userId: number) {
  const token = nanoid(64);
  const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

  await db.insert(pending2FASessions).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

// Get pending 2FA session by token
export async function getPending2FASession(token: string) {
  const [session] = await db
    .select()
    .from(pending2FASessions)
    .where(eq(pending2FASessions.token, token));

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

// Delete pending 2FA session
export async function deletePending2FASession(id: number) {
  await db.delete(pending2FASessions).where(eq(pending2FASessions.id, id));
}
