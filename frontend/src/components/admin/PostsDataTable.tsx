"use client";

import * as React from "react";
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
import Link from "next/link";

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
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import { Post } from "@/types";

export interface AdminPost {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  publishDate: string;
  status: "published" | "draft";
  category: string;
}

function transformPostToAdminPost(post: Post): AdminPost {
  return {
    id: post.slug, // Using slug as ID since that's what we have
    slug: post.slug,
    title: post.title,
    authorName: post.authorName,
    publishDate: post.publishDate || post.createdAt,
    status: post.status,
    category: post.category,
  };
}



interface PostsDataTableProps {
  posts: Post[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
}

export default function PostsDataTable({ posts, isLoading = false, isError = false, error }: PostsDataTableProps) {
  const adminPosts = React.useMemo(
    () => posts.map(transformPostToAdminPost),
    [posts]
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedPostIds, setSelectedPostIds] = React.useState<string[]>([]);
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] = React.useState(false);
  const [singleDeletePost, setSingleDeletePost] = React.useState<AdminPost | null>(null);

  const handleSingleDelete = React.useCallback((post: AdminPost) => {
    setSingleDeletePost(post);
    setShowSingleDeleteDialog(true);
  }, []);

  const confirmSingleDelete = () => {
    if (singleDeletePost) {
      // TODO: Implement actual delete API call
      console.log(`Delete post: ${singleDeletePost.title}`);
    }
    setShowSingleDeleteDialog(false);
    setSingleDeletePost(null);
  };

  const columns: ColumnDef<AdminPost>[] = React.useMemo(() => [
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
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "authorName",
      header: "Author",
      cell: ({ row }) => {
        const authorName = row.getValue("authorName") as string;
        return <div>{authorName}</div>;
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("category")}</div>
      ),
    },
    {
      accessorKey: "publishDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Publish Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("publishDate"));
        const formatted = date.toLocaleDateString();
        return <div className="text-left font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("status")}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const post = row.original;
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
              <Link href={`/blog/${post.slug}`} passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer">
                  <DropdownMenuItem>View Post</DropdownMenuItem>
                </a>
              </Link>
              <DropdownMenuSeparator />
              <Link href={`/admin/posts/edit/${post.id}`} passHref>
                <DropdownMenuItem>Edit Post</DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleSingleDelete(post)}
              >
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: adminPosts,
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
    setSelectedPostIds(selectedIds);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    // TODO: Implement actual delete API call for bulk delete
    table.resetRowSelection();
    setShowDeleteDialog(false);
    setSelectedPostIds([]);
  };

  return (
    <Card className="bg-white p-8 sm:p-10 md:p-6 rounded-xl shadow-lg w-full border-0 text-sm">
      <h2 className="text-2xl font-bold mb-6">Posts</h2>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <ConfirmationDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              title="Delete Posts"
              description={`Are you sure you want to delete ${selectedPostIds.length} selected post${selectedPostIds.length > 1 ? "s" : ""}? This action cannot be undone.`}
              confirmText="Delete"
              onConfirm={confirmDelete}
              variant="destructive"
            >
              <Button variant="destructive" onClick={handleDeleteClick}>
                Delete Selected ({Object.keys(rowSelection).length})
              </Button>
            </ConfirmationDialog>
          )}
          <Link href="/admin/posts/add" passHref>
            <Button className="subscribe-button text-white hover:opacity-90">
              Add Post
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
                    <p className="text-red-600 mb-2">Failed to load posts</p>
                    <p className="text-sm text-muted-foreground">
                      {error instanceof Error ? error.message : "Unknown error occurred"}
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
        title="Delete Post"
        description={`Are you sure you want to delete "${singleDeletePost?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmSingleDelete}
        variant="destructive"
      />
    </Card>
  );
}
