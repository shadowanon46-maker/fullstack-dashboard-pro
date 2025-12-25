import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/auth/security";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    console.log(`\n📧 Password reset request for: ${email}`);
    
    const token = await createPasswordResetToken(email);
    
    if (token) {
      // In production: send email via Resend/SendGrid
      console.log(`🔑 Password reset link: http://localhost:3000/reset-password?token=${token}\n`);
    } else {
      console.log(`❌ Email not found: ${email}\n`);
    }

    return NextResponse.json({
      message: "If your email is registered, you will receive a reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
