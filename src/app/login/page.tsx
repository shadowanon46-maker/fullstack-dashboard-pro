"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 2FA state
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // If we have a 2FA token, submit the 2FA code
    if (twoFactorToken) {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorToken, twoFactorCode }),
      });

      if (res.ok) {
        router.push("/users");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid 2FA code");
      }
      setLoading(false);
      return;
    }

    // Step 1: Submit email/password
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      if (data.requiresTwoFactor) {
        // User has 2FA enabled, show 2FA code input
        setTwoFactorToken(data.twoFactorToken);
      } else {
        // Login successful
        router.push("/users");
        router.refresh();
      }
    } else {
      setError(data.error || "Login failed");
    }

    setLoading(false);
  };

  // Show 2FA code input
  if (twoFactorToken) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-center">
              Masukkan kode 6 digit dari aplikasi authenticator Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Kode 2FA</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setTwoFactorToken(null);
                  setTwoFactorCode("");
                  setError("");
                }}
              >
                Kembali ke Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show email/password form
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              <Link href="/forgot-password" className="underline">
                Lupa Password?
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
