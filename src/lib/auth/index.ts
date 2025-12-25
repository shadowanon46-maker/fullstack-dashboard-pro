import { cookies } from "next/headers";
import { db } from "../db";
import { users } from "../db/schema";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Create a new session
export async function createSession(userId: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  // Store session in cookie (HTTP-only, secure)
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, `${userId}:${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return { token, expiresAt };
}

// Get the current logged-in user
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionValue) return null;

  // Parse userId from session token (format: "userId:token")
  const [userIdStr] = sessionValue.split(":");
  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user || null;
}

// Verify credentials
export async function verifyCredentials(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !user.passwordHash) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

// Delete session (logout)
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Hash password
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
