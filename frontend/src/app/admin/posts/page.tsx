"use client"; // Required for Tanstack Table and client-side interactions

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
import { Author } from "@/types"; // Assuming Author type is available
import { Card } from "@/components/ui/card";

// Define the Post type for the admin section
export interface AdminPost {
  id: string;
  slug: string;
  title: string;
  author: Pick<Author, "name" | "slug">; // Only need name and slug for display
  publishDate: string; // Keep as string for simplicity, can be Date object
  status: "Published" | "Draft" | "Archived"; // Example statuses
  // excerpt?: string; // Optional, if needed for display
  // imageUrl?: string; // Optional
}

// Sample Data for Posts (adapted from homepage)
const sampleAdminPosts: AdminPost[] = [
  {
    id: "1",
    slug: "modern-colorful-caricatures-ai",
    title: "Modern and colorful style of caricatures created by AI",
    author: { name: "Adriana Martins", slug: "adriana-martins" },
    publishDate: "2023-10-21",
    status: "Published",
  },
  {
    id: "2",
    slug: "effective-remote-work-schedules",
    title: "More effective schedules in remote work",
    author: { name: "Adriana Martins", slug: "adriana-martins" },
    publishDate: "2023-10-21",
    status: "Published",
  },
  {
    id: "3",
    slug: "future-web-development-trends",
    title: "The Future of Web Development: Trends to Watch",
    author: { name: "John Doe", slug: "john-doe" },
    publishDate: "2023-11-05",
    status: "Draft",
  },
  {
    id: "4",
    slug: "mindfulness-productivity-balance",
    title: "Mindfulness and Productivity: Finding Balance",
    author: { name: "Jane Smith", slug: "jane-smith" },
    publishDate: "2023-11-12",
    status: "Published",
  },
  {
    id: "5",
    slug: "new-ai-discoveries",
    title: "New Discoveries in AI and Machine Learning",
    author: { name: "John Doe", slug: "john-doe" },
    publishDate: "2024-01-15",
    status: "Archived",
  },
];

export const columns: ColumnDef<AdminPost>[] = [
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
    accessorKey: "author",
    header: "Author",
    cell: ({ row }) => {
      const author = row.getValue("author") as AdminPost["author"];
      return <div>{author.name}</div>;
    },
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
              onClick={() => alert(`Delete post: ${post.title}`)} // Replace with actual delete logic
            >
              Delete Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function ListPostsPage() {
  const [data, setData] = React.useState<AdminPost[]>(() => [
    ...sampleAdminPosts,
  ]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
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

  const deleteSelectedPosts = () => {
    const selectedIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedIds.length === 0) {
      alert("No posts selected.");
      return;
    }
    alert(`Deleting posts with IDs: ${selectedIds.join(", ")}`);
    setData((prevData) =>
      prevData.filter((post) => !selectedIds.includes(post.id))
    );
    table.resetRowSelection();
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
            <Button variant="destructive" onClick={deleteSelectedPosts}>
              Delete Selected ({Object.keys(rowSelection).length})
            </Button>
          )}
          <Link href="/admin/posts/add" passHref>
            <Button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white subscribe-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 h-auto">
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
    </Card>
  );
}
