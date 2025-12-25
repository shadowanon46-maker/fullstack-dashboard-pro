import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { generateTwoFactorSecret, verifyTwoFactorToken, enableTwoFactor, disableTwoFactor } from "@/lib/auth/security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { revalidatePath } from "next/cache";

export default async function TwoFactorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // If 2FA is already enabled
  if (user.twoFactorEnabled) {
    async function handleDisable() {
      "use server";
      const currentUser = await getCurrentUser();
      if (currentUser) {
        await disableTwoFactor(currentUser.id);
        revalidatePath("/settings/two-factor");
      }
    }

    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 max-w-2xl">
          <div>
            <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
            <p className="text-muted-foreground">
              Kelola keamanan 2FA akun Anda.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✓ 2FA Aktif</CardTitle>
              <CardDescription>
                Two-factor authentication sedang aktif untuk akun Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleDisable}>
                <Button type="submit" variant="destructive">
                  Nonaktifkan 2FA
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Generate new 2FA secret for setup
  const { secret, otpauthUrl } = generateTwoFactorSecret(user.email);

  async function handleEnable(formData: FormData) {
    "use server";
    const token = formData.get("token") as string;
    const secretValue = formData.get("secret") as string;
    
    if (!token || !secretValue) return;
    
    const isValid = verifyTwoFactorToken(secretValue, token);
    if (isValid) {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        await enableTwoFactor(currentUser.id, secretValue);
        revalidatePath("/settings/two-factor");
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
          <p className="text-muted-foreground">
            Tambahkan lapisan keamanan tambahan ke akun Anda.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aktifkan 2FA</CardTitle>
            <CardDescription>
              Scan QR code dengan Google Authenticator atau Authy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code placeholder - using text URL since qrcode.react requires client component */}
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Buka aplikasi authenticator dan scan QR code atau masukkan kode manual:
              </p>
              <code className="text-xs break-all bg-background p-2 rounded block">
                {secret}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                URL: {otpauthUrl}
              </p>
            </div>

            <form action={handleEnable} className="space-y-4">
              <input type="hidden" name="secret" value={secret} />
              <div className="space-y-2">
                <Label htmlFor="token">Kode Verifikasi (6 digit)</Label>
                <Input
                  id="token"
                  name="token"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Verifikasi & Aktifkan 2FA
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
