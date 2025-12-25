import { db } from "./index";
import { users } from "./schema";

export async function getUsers() {
  return await db.select().from(users).orderBy(users.id);
}
