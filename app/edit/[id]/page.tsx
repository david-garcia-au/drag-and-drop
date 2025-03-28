import { UserForm } from "@/components/users/user-form";
import { updateUser } from "@/lib/actions";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { userFormSchema } from "@/lib/zodSchemas";
import { z } from "zod";

const prisma = new PrismaClient();

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: id },
    include: {
      images: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  async function handleUpdate(values: z.infer<typeof userFormSchema>) {
    "use server";
    // First we validate the form values
    const parsed = userFormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: "Failed to create user, data validation failed",
      };
    }

    // Then we update the user

    const updatedUser = await updateUser(id, values);
    if (!updatedUser) {
      return { success: false, error: "Failed to update user" };
    }
    return { success: true };
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Edit User</h1>
      <div className="max-w-lg">
        <UserForm user={user} onSubmit={handleUpdate} />
      </div>
    </div>
  );
}
