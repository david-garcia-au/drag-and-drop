import { UserTableClient } from "@/components/users/user-table-client";
import { getUsers } from "../lib/actions";

export default async function Home() {
  const users = await getUsers();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <UserTableClient initialUsers={users} />
    </div>
  );
}
