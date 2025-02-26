import { UserForm } from "@/components/user-form";
import { createUser, uploadImages } from "@/lib/actions";

export default function NewUserPage() {
  async function handleCreate(data: any, tempImages?: File[]) {
    "use server";

    // First create the user
    const newUser = await createUser(data);

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
