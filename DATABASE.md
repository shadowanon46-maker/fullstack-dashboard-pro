# Database Workflow

## Development

1. Ubah schema di `src/lib/db/schema.ts`
2. Jalankan: `npm run db:generate`
3. Review file SQL di `drizzle/`
4. Jalankan: `npm run db:migrate`

## Production

- Migrasi otomatis dijalankan saat container dijalankan (via `scripts/migrate.ts`)
- Pastikan `DATABASE_URL` tersedia di env

## Tools

- `npm run db:studio` → buka UI Drizzle Studio (port 54321)
