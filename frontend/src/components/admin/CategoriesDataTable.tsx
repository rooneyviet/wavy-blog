"use client";

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
  FolderOpen,
} from "lucide-react";
import Link from "next/link";

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
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import DataPagination from "@/components/ui/DataPagination";
import { Category } from "@/types";
import {
  categoryQueries,
  useCategoryMutations,
} from "@/lib/queries/categories";
import { useAuthStore } from "@/stores/authStore";

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
}

function transformCategoryToAdminCategory(category: Category): AdminCategory {
  return {
    id: category.slug, // Using slug as ID since that's what we have
    slug: category.slug,
    name: category.name,
    createdAt: category.created_at,
  };
}

export default function CategoriesDataTable() {
  const { accessToken } = useAuthStore();
  const { deleteMany } = useCategoryMutations();
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery(categoryQueries.list());

  const adminCategories = React.useMemo(
    () => categories.map(transformCategoryToAdminCategory),
    [categories],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = React.useState<
    string[]
  >([]);
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] =
    React.useState(false);
  const [singleDeleteCategory, setSingleDeleteCategory] =
    React.useState<AdminCategory | null>(null);

  const handleSingleDelete = React.useCallback((category: AdminCategory) => {
    setSingleDeleteCategory(category);
    setShowSingleDeleteDialog(true);
  }, []);

  const confirmSingleDelete = () => {
    if (singleDeleteCategory && accessToken) {
      deleteMany.mutate({
        slugs: [singleDeleteCategory.slug],
        accessToken,
      });
    }
    setShowSingleDeleteDialog(false);
    setSingleDeleteCategory(null);
  };

  const columns: ColumnDef<AdminCategory>[] = React.useMemo(
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
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => {
          const slug = row.getValue("slug") as string;
          return <div className="text-muted-foreground">{slug}</div>;
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Created Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          const formatted = date.toLocaleDateString();
          return <div className="text-left font-medium">{formatted}</div>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Link href={`/admin/categories/${category.slug}/edit`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                onClick={() => handleSingleDelete(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleSingleDelete],
  );

  const table = useReactTable({
    data: adminCategories,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
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
    const selectedSlugs = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.slug);
    if (selectedSlugs.length === 0) {
      return;
    }
    setSelectedCategorySlugs(selectedSlugs);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedCategorySlugs.length > 0 && accessToken) {
      deleteMany.mutate({
        slugs: selectedCategorySlugs,
        accessToken,
      });
    }
    table.resetRowSelection();
    setShowDeleteDialog(false);
    setSelectedCategorySlugs([]);
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg w-full border-0 overflow-hidden">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-pink-600" />
          Categories Management
        </h2>

        {/* Enhanced Filters Section */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={
                  (table.getColumn("name")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="pl-10 pr-4 py-3 border-gray-200 focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {Object.keys(rowSelection).length > 0 && (
              <ConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Categories"
                description={`Are you sure you want to delete ${selectedCategorySlugs.length} selected categor${selectedCategorySlugs.length > 1 ? "ies" : "y"}? This action cannot be undone.`}
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
            <Link href="/admin/categories/add" passHref>
              <Button className="subscribe-button text-white hover:opacity-90 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Category
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
                            header.getContext(),
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
                    <p className="text-red-600 mb-2">
                      Failed to load categories
                    </p>
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
                          cell.getContext(),
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
            <span>of {categories.length} categories</span>
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <span className="ml-4 text-pink-600 font-medium">
                {table.getFilteredSelectedRowModel().rows.length} selected
              </span>
            )}
          </div>

          <DataPagination
            data={{
              items: categories,
              pageIndex: 1,
              pageSize: 20,
              total: categories.length,
            }}
          />
        </div>
      </div>

      <ConfirmationDialog
        open={showSingleDeleteDialog}
        onOpenChange={setShowSingleDeleteDialog}
        title="Delete Category"
        description={`Are you sure you want to delete "${singleDeleteCategory?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmSingleDelete}
        variant="destructive"
      />
    </Card>
  );
}
