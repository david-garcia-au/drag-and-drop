"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import type { User, Image } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";

const prisma = new PrismaClient();

// Initialize S3 client once
const s3Client = new S3Client({
  region: String(process.env.AWS_REGION),
  credentials: {
    accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
    secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),
  },
});

// Validate environment variables
function validateEnvVariables() {
  const required = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

export async function getSignedUrl(fileName: string): Promise<string> {
  validateEnvVariables();

  const command = new PutObjectCommand({
    Bucket: String(process.env.AWS_S3_BUCKET_NAME),
    Key: fileName,
    ContentType: "image/*",
  });

  try {
    return await awsGetSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error("Error getting signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
}

export async function uploadImages(
  userId: string,
  files: File[]
): Promise<Image[]> {
  validateEnvVariables();

  const uploadedImages: Image[] = [];

  for (const file of files) {
    try {
      const fileName = `users/${userId}/${Date.now()}-${file.name}`;
      const signedUrl = await getSignedUrl(fileName);

      // Upload to S3
      const response = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }

      // Get the public URL
      const imageUrl = signedUrl.split("?")[0];

      // Get the last position
      const lastImage = await prisma.image.findFirst({
        where: { userId },
        orderBy: { position: "desc" },
      });
      const position = lastImage ? lastImage.position + 1 : 1;

      // Create image record
      const image = await prisma.image.create({
        data: {
          url: imageUrl,
          position,
          userId,
        },
      });

      uploadedImages.push(image);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  }

  revalidatePath("/");
  return uploadedImages;
}

export async function getUsers(): Promise<User[]> {
  return await prisma.user.findMany({
    orderBy: {
      position: "asc",
    },
    include: {
      images: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });
}

export async function createUser(
  user: Omit<User, "id" | "position">
): Promise<User> {
  const lastUser = await prisma.user.findFirst({
    orderBy: { position: "desc" },
  });
  const newPosition = lastUser ? lastUser.position + 1 : 1;

  // Check if the email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  let newEmail = user.email;
  if (existingUser) {
    // If email exists, append a number to make it unique
    let counter = 1;
    do {
      newEmail = `${user.email.split("@")[0]}+${counter}@${
        user.email.split("@")[1]
      }`;
      counter++;
    } while (await prisma.user.findUnique({ where: { email: newEmail } }));
  }

  const newUser = await prisma.user.create({
    data: {
      ...user,
      email: newEmail,
      position: newPosition,
    },
    // include: {
    //   images: true,
    // },
  });
  console.log("newUser", newUser);
  revalidatePath("/");
  return newUser;
}

export async function updateUser(
  id: string,
  user: Omit<User, "id" | "position">
): Promise<User | null> {
  const updatedUser = await prisma.user.update({
    where: { id },
    data: user,
    include: {
      images: true,
    },
  });
  revalidatePath("/");
  return updatedUser;
}

export async function deleteUser(id: string): Promise<boolean> {
  const deletedUser = await prisma.user.delete({
    where: { id },
  });

  // Reorder remaining users
  await prisma.user.updateMany({
    where: {
      position: {
        gt: deletedUser.position,
      },
    },
    data: {
      position: {
        decrement: 1,
      },
    },
  });

  revalidatePath("/");
  return true;
}

export async function updateUserPositions(
  updates: { id: string; newPosition: number }[]
): Promise<boolean> {
  await prisma.$transaction(async (tx) => {
    // Get all users
    const allUsers = await tx.user.findMany({
      orderBy: { position: "asc" },
    });

    // Create a map of id to current position
    const currentPositions = new Map(
      allUsers.map((user) => [user.id, user.position])
    );

    // Sort updates by new position
    updates.sort((a, b) => a.newPosition - b.newPosition);

    for (const update of updates) {
      const currentPosition = currentPositions.get(update.id);
      if (currentPosition === undefined) continue; // Skip if user not found

      if (currentPosition < update.newPosition) {
        // Moving down: decrement positions of users between old and new position
        await tx.user.updateMany({
          where: {
            position: {
              gt: currentPosition,
              lte: update.newPosition,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      } else if (currentPosition > update.newPosition) {
        // Moving up: increment positions of users between new and old position
        await tx.user.updateMany({
          where: {
            position: {
              gte: update.newPosition,
              lt: currentPosition,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      // Update the user's position
      await tx.user.update({
        where: { id: update.id },
        data: { position: update.newPosition },
      });

      // Update the current positions map
      currentPositions.set(update.id, update.newPosition);
    }
  });

  revalidatePath("/");
  return true;
}

export async function deleteImage(imageId: string): Promise<boolean> {
  const image = await prisma.image.delete({
    where: { id: imageId },
  });

  // Reorder remaining images
  await prisma.image.updateMany({
    where: {
      userId: image.userId,
      position: {
        gt: image.position,
      },
    },
    data: {
      position: {
        decrement: 1,
      },
    },
  });

  revalidatePath("/");
  return true;
}

export async function updateImagePositions(
  userId: string,
  updates: { id: string; newPosition: number }[]
): Promise<boolean> {
  await prisma.$transaction(async (tx) => {
    const allImages = await tx.image.findMany({
      where: { userId },
      orderBy: { position: "asc" },
    });

    const currentPositions = new Map(
      allImages.map((image) => [image.id, image.position])
    );

    updates.sort((a, b) => a.newPosition - b.newPosition);

    for (const update of updates) {
      const currentPosition = currentPositions.get(update.id);
      if (currentPosition === undefined) continue;

      if (currentPosition < update.newPosition) {
        await tx.image.updateMany({
          where: {
            userId,
            position: {
              gt: currentPosition,
              lte: update.newPosition,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      } else if (currentPosition > update.newPosition) {
        await tx.image.updateMany({
          where: {
            userId,
            position: {
              gte: update.newPosition,
              lt: currentPosition,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      await tx.image.update({
        where: { id: update.id },
        data: { position: update.newPosition },
      });

      currentPositions.set(update.id, update.newPosition);
    }
  });

  revalidatePath("/");
  return true;
}
