/* eslint-disable @next/next/no-img-element */
"use client"; // Required for Tanstack Table and client-side interactions

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Plus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import { User } from "@/types";
import { userQueries, useUserMutations } from "@/lib/queries/users";
import { useAuthStore } from "@/stores/authStore";

// Define the User type for the admin section
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "author";
  avatarUrl?: string; // Optional: if you want to display avatars
}

function transformUserToAdminUser(user: User): AdminUser {
  return {
    id: user.userID,
    name: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: `https://i.pravatar.cc/40?u=${user.email}`,
  };
}

export default function ListUsersPage() {
  const { accessToken } = useAuthStore();
  const { deleteOne } = useUserMutations();

  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery(userQueries.list(accessToken || ""));

  const adminUsers = React.useMemo(
    () => users.map(transformUserToAdminUser),
    [users]
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] =
    React.useState(false);
  const [singleDeleteUser, setSingleDeleteUser] =
    React.useState<AdminUser | null>(null);

  const handleSingleDelete = React.useCallback((user: AdminUser) => {
    setSingleDeleteUser(user);
    setShowSingleDeleteDialog(true);
  }, []);

  const confirmSingleDelete = () => {
    if (singleDeleteUser && accessToken) {
      deleteOne.mutate({
        username: singleDeleteUser.name, // Use username instead of id
        accessToken,
      });
    }
    setShowSingleDeleteDialog(false);
    setSingleDeleteUser(null);
  };

  const columns: ColumnDef<AdminUser>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center w-12 px-2 py-2">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-12 px-2 py-2">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span>{user.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Email
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="lowercase">{row.getValue("email")}</div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.getValue("role") as string;
          return (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                role === "admin"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {role}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                onClick={() => navigator.clipboard.writeText(user.id)}
                title="Copy ID"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                onClick={() => handleSingleDelete(user)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleSingleDelete]
  );

  const table = useReactTable({
    data: adminUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDeleteClick = () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedIds.length === 0) {
      return;
    }
    setSelectedUserIds(selectedIds);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    // TODO: Implement actual deletion logic here
    table.resetRowSelection(); // Clear selection
    setShowDeleteDialog(false);
    setSelectedUserIds([]);
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg w-full border-0 overflow-hidden">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-pink-600" />
          Users Management
        </h2>

        {/* Enhanced Filters Section */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={
                  (table.getColumn("name")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="pl-10 pr-4 py-3 border-gray-200 focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
            <select className="px-4 py-3 border border-gray-200 rounded-lg focus:border-pink-500 focus:ring-pink-500 bg-white">
              <option>All Roles</option>
              <option>Admin</option>
              <option>Author</option>
            </select>
          </div>

          <div className="flex gap-3">
            {Object.keys(rowSelection).length > 0 && (
              <ConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Users"
                description={`Are you sure you want to delete ${selectedUserIds.length} selected user${selectedUserIds.length > 1 ? "s" : ""}? This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={confirmDelete}
                variant="destructive"
              >
                <Button
                  variant="destructive"
                  onClick={handleDeleteClick}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              </ConfirmationDialog>
            )}
            <Button
              variant="outline"
              className="flex items-center gap-2 border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Link href="/admin/users/add" passHref>
              <Button className="subscribe-button text-white hover:opacity-90 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300"
                >
                  <Filter className="w-4 h-4" />
                  Columns <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Enhanced Table */}
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-pink-50 border-b-2 border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-none">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="font-semibold text-gray-700 uppercase tracking-wider py-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          {isLoading ? (
            <SkeletonRows columnCount={columns.length} rowCount={5} />
          ) : isError ? (
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="text-center">
                    <p className="text-red-600 mb-2">Failed to load users</p>
                    <p className="text-sm text-muted-foreground">
                      {error instanceof Error
                        ? error.message
                        : "Unknown error occurred"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-gray-100 hover:bg-pink-50/50 transition-colors duration-200 group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>
      {/* Enhanced Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Showing</span>
            <select className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span>of {table.getFilteredRowModel().rows.length} users</span>
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <span className="ml-4 text-pink-600 font-medium">
                {table.getFilteredSelectedRowModel().rows.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                className="bg-pink-500 text-white hover:bg-pink-600"
              >
                1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                2
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={showSingleDeleteDialog}
        onOpenChange={setShowSingleDeleteDialog}
        title="Delete User"
        description={`Are you sure you want to delete "${singleDeleteUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmSingleDelete}
        variant="destructive"
      />
    </Card>
  );
}
