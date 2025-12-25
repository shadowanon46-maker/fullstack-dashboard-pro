import { cookies } from "next/headers";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Create session in DB + set cookie
export async function createSession(
  userId: number,
  userAgent?: string,
  ip?: string
) {
  const token = nanoid(64); // Strong random token
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  // Store in database
  await db.insert(sessions).values({
    userId,
    token,
    userAgent: userAgent || null,
    ip: ip || null,
    expiresAt,
  });

  // Store token in HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return { token, expiresAt };
}

// Get the current logged-in user (verify session in DB)
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    // Session expired or invalid
    cookieStore.delete(SESSION_COOKIE_NAME);
    if (session) {
      // Clean up expired session from DB
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId));
  return user || null;
}

// Verify credentials
export async function verifyCredentials(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !user.passwordHash) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

// Delete session (logout) - remove from DB + cookie
export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Logout from all devices
export async function deleteAllSessions(userId: number) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// Hash password
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// Get all active sessions for a user
export async function getUserSessions(userId: number) {
  return await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(sessions.createdAt);
}

// Revoke a specific session
export async function revokeSession(sessionId: number) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
