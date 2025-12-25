import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import * as bcrypt from "bcrypt";

async function createAdmin() {
  const hash = await bcrypt.hash("admin123", 12);
  
  // Check if admin already exists
  const existing = await db.select().from(users).where(
    require("drizzle-orm").eq(users.email, "admin@example.com")
  );
  
  if (existing.length > 0) {
    console.log("Admin user already exists!");
    process.exit(0);
  }
  
  await db.insert(users).values({
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    passwordHash: hash,
  });
  
  console.log("Admin user created!");
  console.log("Email: admin@example.com");
  console.log("Password: admin123");
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("Error creating admin:", err);
  process.exit(1);
});
