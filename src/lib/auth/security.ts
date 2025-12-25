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
