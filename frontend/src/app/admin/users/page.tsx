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
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User } from "@/types";
import { userQueries } from "@/lib/queries/users";
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
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] = React.useState(false);
  const [singleDeleteUser, setSingleDeleteUser] = React.useState<AdminUser | null>(null);

  const handleSingleDelete = React.useCallback((user: AdminUser) => {
    setSingleDeleteUser(user);
    setShowSingleDeleteDialog(true);
  }, []);

  const confirmSingleDelete = () => {
    if (singleDeleteUser) {
      // TODO: Implement actual delete API call
      console.log(`Delete user: ${singleDeleteUser.name}`);
    }
    setShowSingleDeleteDialog(false);
    setSingleDeleteUser(null);
  };

  const columns: ColumnDef<AdminUser>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center w-12 px-2 py-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <div className="capitalize">{row.getValue("role")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
              >
                Copy user ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href={`/admin/users/edit/${user.id}`} passHref>
                <DropdownMenuItem>Edit User</DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleSingleDelete(user)}
              >
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading users..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load users</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full border-0 text-sm">
      <h2 className="text-2xl font-bold mb-6">Users</h2>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex gap-2">
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
              <Button variant="destructive" onClick={handleDeleteClick}>
                Delete Selected ({Object.keys(rowSelection).length})
              </Button>
            </ConfirmationDialog>
          )}
          <Link href="/admin/users/add" passHref>
            <Button className="subscribe-button text-white hover:opacity-90">
              Add User
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
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
