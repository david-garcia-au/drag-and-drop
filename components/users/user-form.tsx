"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { User, Image } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multi-select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "../image-uploader";
import {
  uploadImages,
  deleteImage,
  updateImagePositions,
} from "../../lib/actions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { userFormSchema } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface UserFormProps {
  user?: User & { images?: Image[] };
  onSubmit: (
    user: Omit<User, "id">,
    tempImages?: File[]
  ) => Promise<{ success: boolean; error?: string }>;
}

export const ROLES = ["Admin", "User", "Editor"];

function SortableImage({
  image,
  onDelete,
}: {
  image: Image;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-background rounded-lg shadow-sm"
    >
      <div className="aspect-square overflow-hidden rounded-lg">
        <img
          src={image.url || "/placeholder.svg"}
          alt="User image"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-2 hover:text-primary"
        >
          <GripVertical className="h-5 w-5 text-white" />
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-red-500 hover:text-red-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function ImagePreview({
  url,
  onDelete,
}: {
  url: string;
  onDelete: () => void;
}) {
  return (
    <div className="relative bg-background rounded-lg shadow-sm">
      <div className="aspect-square overflow-hidden rounded-lg">
        <img
          src={url || "/placeholder.svg"}
          alt="Preview"
          className="w-full h-full object-cover"
        />
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function UserForm({ user, onSubmit }: UserFormProps) {
  const router = useRouter();

  const [images, setImages] = useState<Image[]>(user?.images ?? []);
  const [tempImages, setTempImages] = useState<File[]>([]);
  const [tempImagePreviews, setTempImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      setImages(user.images ?? []);
    }
  }, [user]);

  const handleImageDelete = async (imageId: string) => {
    try {
      await deleteImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success(`Image deleted successfully.`);
    } catch (error) {
      toast.error(`Error deleting image. Please try again.`);
    }
  };

  const handleTempImageDelete = (index: number) => {
    setTempImages((prev) => prev.filter((_, i) => i !== index));
    setTempImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !user) return;

    const oldIndex = images.findIndex((item) => item.id === active.id);
    const newIndex = images.findIndex((item) => item.id === over.id);

    // Update local state first
    const newOrder = arrayMove(images, oldIndex, newIndex);
    setImages(newOrder);

    // Then update positions in the backend
    try {
      await updateImagePositions(
        user.id,
        newOrder.map((image, index) => ({
          id: image.id,
          newPosition: index + 1,
        }))
      );
    } catch (error) {
      // Revert to previous order if update fails
      setImages(images);
      toast.error(`Failed to update image positions. Please try again.`);
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (user?.id) {
      // Existing user - upload directly
      setIsUploading(true);
      try {
        const newImages = await uploadImages(user.id, files);
        setImages((prev) => [...prev, ...newImages]);
      } catch (error) {
        console.error("Error uploading images:", error);
      } finally {
        setIsUploading(false);
      }
    } else {
      // New user - store temporarily
      const newPreviews = await Promise.all(
        files.map((file) => URL.createObjectURL(file))
      );
      setTempImagePreviews((prev) => [...prev, ...newPreviews]);
      setTempImages((prev) => [...prev, ...files]);
    }
  };

  // Cleanup temporary image previews
  useEffect(() => {
    return () => {
      tempImagePreviews.forEach(URL.revokeObjectURL);
    };
  }, [tempImagePreviews]);

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      roles: user?.roles || [],
    },
  });

  async function submitFormAction(values: z.infer<typeof userFormSchema>) {
    // try {
    //   console.log(values, tempImages);
    //   toast(
    //     <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
    //       <code className="text-white">
    //         {JSON.stringify(values, null, 2)}
    //         {JSON.stringify(tempImages, null, 2)}
    //       </code>
    //     </pre>
    //   );
    // } catch (error) {
    //   console.error("Form submission error", error);
    //   toast.error("Failed to submit the form. Please try again.");
    // }
    const result = await onSubmit(values, tempImages);
    if (result.success) {
      toast.success(`${user ? "User updated" : "User created"} successfully.`);
      router.push("/");
    } else {
      toast.error(
        `Error  ${user ? "updating" : "creating"} user. Please try again.`
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitFormAction)}>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">User Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-3 items-center">
                    <FormLabel className="py-0 text-sm">Username</FormLabel>
                    <FormMessage className="text-sm" />
                  </div>
                  <FormControl>
                    <Input placeholder="shadcn" type="text" {...field} />
                  </FormControl>
                  {/* <FormDescription>
                    This is your public display name.
                  </FormDescription> */}
                  {/* <FormMessage /> */}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-3 items-center">
                    <FormLabel className="py-0 text-sm">Email</FormLabel>
                    <FormMessage className="text-sm" />
                  </div>{" "}
                  <FormControl>
                    <Input placeholder="email" type="" {...field} />
                  </FormControl>
                  {/* <FormDescription>
                    This is your public display name.
                  </FormDescription> */}
                  {/* <FormMessage /> */}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-3 items-center">
                    <FormLabel className="py-0 text-sm">Role</FormLabel>
                    <FormMessage className="text-sm" />
                  </div>
                  <FormControl>
                    <MultiSelector
                      values={field.value}
                      onValuesChange={field.onChange}
                      loop
                      className="max-w-xs"
                    >
                      <MultiSelectorTrigger>
                        <MultiSelectorInput
                          placeholder="Select role"
                          className="text-sm"
                        />
                      </MultiSelectorTrigger>
                      <MultiSelectorContent>
                        <MultiSelectorList>
                          {ROLES.map((role) => (
                            <MultiSelectorItem key={role} value={role}>
                              {role}
                            </MultiSelectorItem>
                          ))}
                        </MultiSelectorList>
                      </MultiSelectorContent>
                    </MultiSelector>
                  </FormControl>
                  {/* <FormDescription>Select multiple options.</FormDescription> */}
                  {/* <FormMessage /> */}
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="images" className="space-y-6">
            <div>
              <Label>Upload Images</Label>
              <ImageUploader
                onUpload={handleImageUpload}
                isUploading={isUploading}
              />
            </div>

            {/* Temporary image previews for new users */}
            {!user && tempImagePreviews.length > 0 && (
              <div>
                <Label>Selected Images</Label>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  {tempImagePreviews.map((url, index) => (
                    <ImagePreview
                      key={index}
                      url={url}
                      onDelete={() => handleTempImageDelete(index)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Existing images for editing users */}
            {user && images.length > 0 && (
              <div>
                <Label>Current Images</Label>
                <div className="mt-2 border rounded-lg p-4 bg-muted/50">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={images.map((img) => img.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-3 gap-4">
                        {images.map((image) => (
                          <SortableImage
                            key={image.id}
                            image={image}
                            onDelete={() => handleImageDelete(image.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">{user ? "Update" : "Create"}</Button>
        </div>
      </form>
    </Form>
  );
}
