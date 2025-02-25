// "use client";

// import type React from "react";
// import { useState, useEffect } from "react";
// import type { User, Image } from "@prisma/client";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Check, ChevronsUpDown, X, GripVertical } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { useRouter } from "next/navigation";
// import { ImageUploader } from "./image-uploader";
// import {
//   uploadImages,
//   deleteImage,
//   updateImagePositions,
// } from "../lib/actions";
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   type DragEndEvent,
// } from "@dnd-kit/core";
// import {
//   SortableContext,
//   arrayMove,
//   sortableKeyboardCoordinates,
//   useSortable,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";

// interface UserFormProps {
//   user?: User & { images?: Image[] };
//   onSubmit: (user: Omit<User, "id">, tempImages?: File[]) => Promise<void>;
// }

// export const ROLES = ["Admin", "User", "Editor"];

// function SortableImage({
//   image,
//   onDelete,
// }: {
//   image: Image;
//   onDelete: () => void;
// }) {
//   const { attributes, listeners, setNodeRef, transform, transition } =
//     useSortable({ id: image.id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       style={style}
//       className="group relative bg-background rounded-lg shadow-sm"
//     >
//       <div className="aspect-square overflow-hidden rounded-lg">
//         <img
//           src={image.url || "/placeholder.svg"}
//           alt="User image"
//           className="w-full h-full object-cover"
//         />
//       </div>
//       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
//         <div
//           {...attributes}
//           {...listeners}
//           className="cursor-move p-2 hover:text-primary"
//         >
//           <GripVertical className="h-5 w-5 text-white" />
//         </div>
//         <button
//           type="button"
//           onClick={onDelete}
//           className="p-2 text-red-500 hover:text-red-400"
//         >
//           <X className="h-5 w-5" />
//         </button>
//       </div>
//     </div>
//   );
// }

// function ImagePreview({
//   url,
//   onDelete,
// }: {
//   url: string;
//   onDelete: () => void;
// }) {
//   return (
//     <div className="relative bg-background rounded-lg shadow-sm">
//       <div className="aspect-square overflow-hidden rounded-lg">
//         <img
//           src={url || "/placeholder.svg"}
//           alt="Preview"
//           className="w-full h-full object-cover"
//         />
//       </div>
//       <button
//         type="button"
//         onClick={onDelete}
//         className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
//       >
//         <X className="h-4 w-4" />
//       </button>
//     </div>
//   );
// }

// export function UserForm({ user, onSubmit }: UserFormProps) {
//   const router = useRouter();
//   const [name, setName] = useState(user?.name ?? "");
//   const [email, setEmail] = useState(user?.email ?? "");
//   const [roles, setRoles] = useState<string[]>(user?.roles ?? []);
//   const [images, setImages] = useState<Image[]>(user?.images ?? []);
//   const [tempImages, setTempImages] = useState<File[]>([]);
//   const [tempImagePreviews, setTempImagePreviews] = useState<string[]>([]);
//   const [isUploading, setIsUploading] = useState(false);
//   const [open, setOpen] = useState(false);

//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   useEffect(() => {
//     if (user) {
//       setName(user.name);
//       setEmail(user.email);
//       setRoles(user.roles);
//       setImages(user.images ?? []);
//     }
//   }, [user]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     await onSubmit({ name, email, roles }, tempImages);
//   };

//   const handleImageDelete = async (imageId: string) => {
//     await deleteImage(imageId);
//     setImages((prev) => prev.filter((img) => img.id !== imageId));
//   };

//   const handleTempImageDelete = (index: number) => {
//     setTempImages((prev) => prev.filter((_, i) => i !== index));
//     setTempImagePreviews((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleDragEnd = async (event: DragEndEvent) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id || !user) return;

//     setImages((items) => {
//       const oldIndex = items.findIndex((item) => item.id === active.id);
//       const newIndex = items.findIndex((item) => item.id === over.id);
//       const newOrder = arrayMove(items, oldIndex, newIndex);

//       updateImagePositions(
//         user.id,
//         newOrder.map((image, index) => ({
//           id: image.id,
//           newPosition: index + 1,
//         }))
//       );

//       return newOrder;
//     });
//   };

//   const handleImageUpload = async (files: File[]) => {
//     if (user?.id) {
//       // Existing user - upload directly
//       setIsUploading(true);
//       try {
//         const newImages = await uploadImages(user.id, files);
//         setImages((prev) => [...prev, ...newImages]);
//       } catch (error) {
//         console.error("Error uploading images:", error);
//       } finally {
//         setIsUploading(false);
//       }
//     } else {
//       // New user - store temporarily
//       const newPreviews = await Promise.all(
//         files.map((file) => URL.createObjectURL(file))
//       );
//       setTempImagePreviews((prev) => [...prev, ...newPreviews]);
//       setTempImages((prev) => [...prev, ...files]);
//     }
//   };

//   // Cleanup temporary image previews
//   useEffect(() => {
//     return () => {
//       tempImagePreviews.forEach(URL.revokeObjectURL);
//     };
//   }, [tempImagePreviews]);

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       <div>
//         <Label htmlFor="name">Name</Label>
//         <Input
//           id="name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           required
//         />
//       </div>
//       <div>
//         <Label htmlFor="email">Email</Label>
//         <Input
//           id="email"
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//       </div>
//       <div>
//         <Label>Roles</Label>
//         <Popover open={open} onOpenChange={setOpen}>
//           <PopoverTrigger asChild>
//             <Button
//               variant="outline"
//               role="combobox"
//               aria-expanded={open}
//               className="w-full justify-between"
//             >
//               {roles.length > 0 ? roles.join(", ") : "Select roles..."}
//               <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//             </Button>
//           </PopoverTrigger>
//           <PopoverContent className="w-full p-0">
//             <Command>
//               <CommandInput placeholder="Search roles..." />
//               <CommandList>
//                 <CommandEmpty>No role found.</CommandEmpty>
//                 <CommandGroup>
//                   {ROLES.map((role) => (
//                     <CommandItem
//                       key={role}
//                       onSelect={() => {
//                         setRoles((prev) =>
//                           prev.includes(role)
//                             ? prev.filter((r) => r !== role)
//                             : [...prev, role]
//                         );
//                       }}
//                     >
//                       <Check
//                         className={cn(
//                           "mr-2 h-4 w-4",
//                           roles.includes(role) ? "opacity-100" : "opacity-0"
//                         )}
//                       />
//                       {role}
//                     </CommandItem>
//                   ))}
//                 </CommandGroup>
//               </CommandList>
//             </Command>
//           </PopoverContent>
//         </Popover>
//       </div>
//       <div className="space-y-4">
//         <div>
//           <Label>Upload Images</Label>
//           <ImageUploader
//             onUpload={handleImageUpload}
//             isUploading={isUploading}
//           />
//         </div>

//         {/* Temporary image previews for new users */}
//         {!user && tempImagePreviews.length > 0 && (
//           <div>
//             <Label>Selected Images</Label>
//             <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
//               {tempImagePreviews.map((url, index) => (
//                 <ImagePreview
//                   key={index}
//                   url={url}
//                   onDelete={() => handleTempImageDelete(index)}
//                 />
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Existing images for editing users */}
//         {user && images.length > 0 && (
//           <div>
//             <Label>Current Images</Label>
//             <div className="mt-2 border rounded-lg p-4 bg-muted/50">
//               <DndContext
//                 sensors={sensors}
//                 collisionDetection={closestCenter}
//                 onDragEnd={handleDragEnd}
//               >
//                 <SortableContext
//                   items={images.map((img) => img.id)}
//                   strategy={verticalListSortingStrategy}
//                 >
//                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
//                     {images.map((image) => (
//                       <SortableImage
//                         key={image.id}
//                         image={image}
//                         onDelete={() => handleImageDelete(image.id)}
//                       />
//                     ))}
//                   </div>
//                 </SortableContext>
//               </DndContext>
//             </div>
//           </div>
//         )}
//       </div>
//       <div className="flex justify-end space-x-2">
//         <Button type="button" variant="outline" onClick={() => router.back()}>
//           Cancel
//         </Button>
//         <Button type="submit">{user ? "Update" : "Create"}</Button>
//       </div>
//     </form>
//   );
// }

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { User, Image } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ChevronsUpDown, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ImageUploader } from "./image-uploader";
import {
  uploadImages,
  deleteImage,
  updateImagePositions,
} from "../lib/actions";
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

interface UserFormProps {
  user?: User & { images?: Image[] };
  onSubmit: (user: Omit<User, "id">, tempImages?: File[]) => Promise<void>;
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
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [roles, setRoles] = useState<string[]>(user?.roles ?? []);
  const [images, setImages] = useState<Image[]>(user?.images ?? []);
  const [tempImages, setTempImages] = useState<File[]>([]);
  const [tempImagePreviews, setTempImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRoles(user.roles);
      setImages(user.images ?? []);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, email, roles }, tempImages);
  };

  const handleImageDelete = async (imageId: string) => {
    await deleteImage(imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleTempImageDelete = (index: number) => {
    setTempImages((prev) => prev.filter((_, i) => i !== index));
    setTempImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !user) return;

    setImages((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);

      updateImagePositions(
        user.id,
        newOrder.map((image, index) => ({
          id: image.id,
          newPosition: index + 1,
        }))
      );

      return newOrder;
    });
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

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">User Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Roles</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {roles.length > 0 ? roles.join(", ") : "Select roles..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search roles..." />
                  <CommandList>
                    <CommandEmpty>No role found.</CommandEmpty>
                    <CommandGroup>
                      {ROLES.map((role) => (
                        <CommandItem
                          key={role}
                          onSelect={() => {
                            setRoles((prev) =>
                              prev.includes(role)
                                ? prev.filter((r) => r !== role)
                                : [...prev, role]
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              roles.includes(role) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {role}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
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
  );
}
