// "use client";

// import type React from "react";
// import type { ColumnDef } from "@tanstack/react-table";
// import type { User } from "@prisma/client";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   ArrowUpDown,
//   ArrowUp,
//   ArrowDown,
//   ChevronDown,
//   MoreVertical,
//   Copy,
//   Edit,
//   Trash,
//   GripVertical,
// } from "lucide-react";
// import { createUser, deleteUser } from "@/lib/actions";
// import Link from "next/link";

// export const ROLES = ["Admin", "User", "Editor"];

// export const columns = (
//   setUsers: React.Dispatch<React.SetStateAction<User[]>>
// ): ColumnDef<User>[] => [
//   {
//     id: "drag",
//     cell: () => <GripVertical className="h-4 w-4 cursor-move" />,
//   },
//   {
//     accessorKey: "name",
//     header: ({ column }) => {
//       return (
//         <Button
//           variant="ghost"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//         >
//           Name
//           {column.getIsSorted() === "asc" ? (
//             <ArrowUp className="ml-2 h-4 w-4" />
//           ) : column.getIsSorted() === "desc" ? (
//             <ArrowDown className="ml-2 h-4 w-4" />
//           ) : (
//             <ArrowUpDown className="ml-2 h-4 w-4" />
//           )}
//         </Button>
//       );
//     },
//   },
//   {
//     accessorKey: "email",
//     header: ({ column }) => {
//       return (
//         <Button
//           variant="ghost"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//         >
//           Email
//           {column.getIsSorted() === "asc" ? (
//             <ArrowUp className="ml-2 h-4 w-4" />
//           ) : column.getIsSorted() === "desc" ? (
//             <ArrowDown className="ml-2 h-4 w-4" />
//           ) : (
//             <ArrowUpDown className="ml-2 h-4 w-4" />
//           )}
//         </Button>
//       );
//     },
//   },
//   {
//     accessorKey: "roles",
//     header: ({ column }) => {
//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost">
//               Filter by Role
//               <ChevronDown className="ml-2 h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="start">
//             {ROLES.map((role) => (
//               <DropdownMenuCheckboxItem
//                 key={role}
//                 checked={column.getFilterValue()?.includes(role)}
//                 onCheckedChange={(checked) => {
//                   column.setFilterValue((old: string[] = []) => {
//                     return checked
//                       ? [...old, role]
//                       : old.filter((value) => value !== role);
//                   });
//                 }}
//               >
//                 {role}
//               </DropdownMenuCheckboxItem>
//             ))}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       );
//     },
//     cell: ({ row }) => {
//       const roles = row.getValue("roles") as string[];
//       return (
//         <div className="flex flex-wrap gap-1">
//           {roles.map((role) => (
//             <span
//               key={role}
//               className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                 role === "Admin"
//                   ? "bg-red-100 text-red-800"
//                   : role === "User"
//                   ? "bg-green-100 text-green-800"
//                   : "bg-blue-100 text-blue-800"
//               }`}
//             >
//               {role}
//             </span>
//           ))}
//         </div>
//       );
//     },
//     filterFn: (row, id, filterValue: string[]) => {
//       const rowRoles = row.getValue(id) as string[];
//       return (
//         filterValue.length === 0 ||
//         filterValue.some((filter) => rowRoles.includes(filter))
//       );
//     },
//   },
//   {
//     id: "actions",
//     cell: ({ row }) => (
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button variant="ghost" className="h-8 w-8 p-0">
//             <MoreVertical className="h-4 w-4" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end">
//           <DropdownMenuItem
//             onClick={async () => {
//               const { id, ...userWithoutId } = row.original;
//               const newUser = await createUser(userWithoutId);
//               setUsers((prevUsers) => [...prevUsers, newUser]);
//             }}
//           >
//             <Copy className="mr-2 h-4 w-4" />
//             <span>Duplicate</span>
//           </DropdownMenuItem>
//           <DropdownMenuItem asChild>
//             <Link
//               href={`/edit/${row.original.id}`}
//               className="flex items-center"
//             >
//               <Edit className="mr-2 h-4 w-4" />
//               <span>Edit</span>
//             </Link>
//           </DropdownMenuItem>
//           <DropdownMenuItem
//             onClick={async () => {
//               const success = await deleteUser(row.original.id);
//               if (success) {
//                 setUsers((prevUsers) =>
//                   prevUsers.filter((user) => user.id !== row.original.id)
//                 );
//               }
//             }}
//           >
//             <Trash className="mr-2 h-4 w-4" />
//             <span>Delete</span>
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     ),
//   },
// ];

"use client";

import type React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { User, Image } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  MoreVertical,
  Copy,
  Edit,
  Trash,
  GripVertical,
} from "lucide-react";
import { createUser, deleteUser } from "../lib/actions";
import Link from "next/link";

export const ROLES = ["Admin", "User", "Editor"];

export const columns = (
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
): ColumnDef<User>[] => [
  {
    id: "drag",
    cell: () => <GripVertical className="h-4 w-4 cursor-move" />,
  },
  {
    accessorKey: "images",
    header: "Image",
    cell: ({ row }) => {
      const images = row.original.images as Image[];
      const firstImage = images?.[0];
      return (
        <div className="relative w-10 h-10 rounded-md overflow-hidden">
          {firstImage ? (
            <img
              src={firstImage.url || "/placeholder.svg"}
              alt={`${row.original.name}'s image`}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-slate-200" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
  },
  {
    accessorKey: "roles",
    header: ({ column }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              Filter by Role
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ROLES.map((role) => (
              <DropdownMenuCheckboxItem
                key={role}
                checked={column.getFilterValue()?.includes(role)}
                onCheckedChange={(checked) => {
                  column.setFilterValue((old: string[] = []) => {
                    return checked
                      ? [...old, role]
                      : old.filter((value) => value !== role);
                  });
                }}
              >
                {role}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    cell: ({ row }) => {
      const roles = row.getValue("roles") as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role) => (
            <span
              key={role}
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                role === "Admin"
                  ? "bg-red-100 text-red-800"
                  : role === "User"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {role}
            </span>
          ))}
        </div>
      );
    },
    filterFn: (row, id, filterValue: string[]) => {
      const rowRoles = row.getValue(id) as string[];
      return (
        filterValue.length === 0 ||
        filterValue.some((filter) => rowRoles.includes(filter))
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={async () => {
              const { id, ...userWithoutId } = row.original;
              const newUser = await createUser(userWithoutId);
              setUsers((prevUsers) => [...prevUsers, newUser]);
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/edit/${row.original.id}`}
              className="flex items-center"
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const success = await deleteUser(row.original.id);
              if (success) {
                setUsers((prevUsers) =>
                  prevUsers.filter((user) => user.id !== row.original.id)
                );
              }
            }}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
