import { UserForm } from "@/components/users/user-form";
import { createUser, uploadImages } from "@/lib/actions";
import { userFormSchema } from "@/lib/zodSchemas";
import { z } from "zod";

export default function NewUserPage() {
  async function handleCreate(
    values: z.infer<typeof userFormSchema>,
    tempImages?: File[]
  ) {
    "use server";

    // First we validate the form
    const parsed = userFormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: "Failed to create user, data validation failed",
      };
    }

    // Then we create the user
    const newUser = await createUser(values);

    // Then upload any temporary images
    if (tempImages && tempImages.length > 0) {
      await uploadImages(newUser.id, tempImages);
    }

    if (!newUser) {
      return { success: false, error: "Failed to create user" };
    }
    return { success: true };
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Create New User</h1>
      <div className="max-w-lg">
        <UserForm onSubmit={handleCreate} />
      </div>
    </div>
  );
}
