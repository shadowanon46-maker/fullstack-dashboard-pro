import { getCurrentUser, getUserSessions, revokeSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { revalidatePath } from "next/cache";

export default async function SessionsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const activeSessions = await getUserSessions(currentUser.id);

  async function handleRevoke(formData: FormData) {
    "use server";
    const sessionId = Number(formData.get("sessionId"));
    if (sessionId) {
      await revokeSession(sessionId);
      revalidatePath("/sessions");
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Sesi Aktif</h1>
          <p className="text-muted-foreground">
            Kelola perangkat yang sedang login.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sesi Anda ({activeSessions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSessions.length === 0 ? (
              <p className="text-muted-foreground">Tidak ada sesi aktif.</p>
            ) : (
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {session.userAgent?.substring(0, 60) || "Unknown device"}...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        IP: {session.ip || "Unknown"} • Login:{" "}
                        {session.createdAt?.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {session.expiresAt?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <form action={handleRevoke}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        Cabut Akses
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
