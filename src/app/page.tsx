import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard Profesional</h1>
      <p className="text-muted-foreground">
        Selamat datang di sistem manajemen internal.
      </p>
      <div className="flex gap-2">
        <Link href="/users">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Kelola Pengguna
          </button>
        </Link>
      </div>
    </div>
  );
}