"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";

const prisma = new PrismaClient();

export async function getUsers(): Promise<User[]> {
  return await prisma.user.findMany({
    orderBy: {
      position: "asc",
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
  });
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
