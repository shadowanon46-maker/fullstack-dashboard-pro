import { NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/lib/auth";
import { users } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  checkLoginAttempts,
  recordFailedAttempt,
  resetLoginAttempts,
  verifyTwoFactorToken,
  createPending2FASession,
  getPending2FASession,
  deletePending2FASession,
} from "@/lib/auth/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, twoFactorCode, twoFactorToken } = body;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // ==========================================
    // STEP 2: Verify 2FA code (if twoFactorToken is present)
    // ==========================================
    if (twoFactorToken && twoFactorCode) {
      const pendingSession = await getPending2FASession(twoFactorToken);
      if (!pendingSession) {
        return NextResponse.json(
          { error: "Invalid or expired 2FA session" },
          { status: 400 }
        );
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, pendingSession.userId));

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
      }

      const isValid = verifyTwoFactorToken(user.twoFactorSecret, twoFactorCode);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 400 });
      }

      // Delete pending session
      await deletePending2FASession(pendingSession.id);

      // Create full session
      await createSession(user.id, userAgent, ip);
      await resetLoginAttempts(user.email);

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, role: user.role },
      });
    }

    // ==========================================
    // STEP 1: Verify email + password
    // ==========================================
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Check brute-force protection
    try {
      await checkLoginAttempts(email, ip);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 429 }
      );
    }

    // Verify credentials
    const user = await verifyCredentials(email, password);
    if (!user) {
      await recordFailedAttempt(email, ip);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // If 2FA is enabled, create pending session
    if (user.twoFactorEnabled) {
      const token = await createPending2FASession(user.id);
      return NextResponse.json({
        requiresTwoFactor: true,
        twoFactorToken: token,
      });
    }

    // No 2FA, create full session
    await createSession(user.id, userAgent, ip);
    await resetLoginAttempts(email);

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
