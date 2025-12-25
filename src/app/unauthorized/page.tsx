import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold text-destructive">Akses Ditolak</h1>
      <p className="mt-2 text-muted-foreground">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Button className="mt-4" asChild>
        <Link href="/">Kembali ke Home</Link>
      </Button>
    </div>
  );
}
