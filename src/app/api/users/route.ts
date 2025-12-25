import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userInsertSchema } from "@/lib/db/schema";
import { z } from "zod";

export async function GET() {
  try {
    const allUsers = await db.select().from(users).orderBy(users.id);
    return NextResponse.json(allUsers, { status: 200 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = userInsertSchema.parse(body); // ✅ Zod validation

    const [newUser] = await db.insert(users).values(validated).returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
