// src/lib/db/test-query.ts
import { eq } from "drizzle-orm";
import { db } from ".";
import { users } from "./schema";

async function test() {
  // Insert
  await db.insert(users).values({
    name: "Test User",
    email: "test@example.com",
  });

  // Select
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers);

  // Clean up (opsional)
  await db.delete(users).where(eq(users.email, "test@example.com"));
}

test().catch(console.error);