import { createUser, updateUser, deleteUser } from "@/lib/actions";
import { UserTableClient } from "./user-table-client";
import type { User } from "@prisma/client";

interface UserTableProps {
  initialUsers: User[];
}

export async function UserTable({ initialUsers }: UserTableProps) {
  return (
    <UserTableClient
      initialUsers={initialUsers}
      createUser={createUser}
      updateUser={updateUser}
      deleteUser={deleteUser}
    />
  );
}
