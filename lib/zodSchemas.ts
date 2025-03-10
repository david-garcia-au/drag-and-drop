import { z } from "zod";

// Define the roles that are allowed
export const ROLES = ["admin", "editor", "viewer"];

// User schema for form validation
export const userFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(20, "Name must be less than 20 characters"),
  email: z.string().email("Please enter a valid email address."),
  roles: z.array(z.string()).min(1, {
    message: "Please select at least one role.",
  }),
  bio: z.string().max(300, "Bio must be less than 100 characters"),
});

// Type inference from the schema
export type UserFormValues = z.infer<typeof userFormSchema>;
