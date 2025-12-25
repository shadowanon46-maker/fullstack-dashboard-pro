import { getUsers } from "@/lib/db/queries";
import { UserManagementClient } from "./components/UserManagementClient";

export default async function UserManagementPage() {
  const users = await getUsers();

  return <UserManagementClient initialUsers={users} />;
}
