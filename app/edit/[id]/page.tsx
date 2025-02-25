import { UserForm } from "@/components/user-form";
import { updateUser } from "@/lib/actions";
import { PrismaClient } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: (await params).id },
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

  async function handleUpdate(data: any) {
    "use server";
    await updateUser(params.id, data);
    redirect("/");
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
