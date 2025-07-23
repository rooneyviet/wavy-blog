"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface PaginatedResponse<T> {
  items: T[];
  pageSize: number;
  pageIndex: number; // 1-based indexing
  total: number;
}

export interface DataPaginationProps<T> {
  data: PaginatedResponse<T>;
  className?: string;
}

export default function DataPagination<T>({
  data,
  className,
}: DataPaginationProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { items, pageIndex, pageSize, total } = data;

  // Calculate if there are more pages
  const hasNextPage = pageIndex * pageSize < total;

  const buildUrl = (newPageIndex: number, newPageSize?: number) => {
    const params = new URLSearchParams(searchParams);
    const targetPageSize = newPageSize || pageSize;

    // Remove params if they are default values (page 1, pageSize 20)
    if (newPageIndex === 1 && targetPageSize === 20) {
      params.delete("pageIndex");
      params.delete("pageSize");
    } else {
      if (newPageIndex === 1) {
        params.delete("pageIndex");
      } else {
        params.set("pageIndex", newPageIndex.toString());
      }

      if (targetPageSize === 20) {
        params.delete("pageSize");
      } else {
        params.set("pageSize", targetPageSize.toString());
      }
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const updateUrlParams = (newPageIndex: number, newPageSize?: number) => {
    const url = buildUrl(newPageIndex, newPageSize);
    router.push(url, { scroll: false });
  };

  const handlePageChange = (newPageIndex: number) => {
    updateUrlParams(newPageIndex);
  };

  const handlePrevPage = () => {
    if (pageIndex > 1) {
      updateUrlParams(pageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      updateUrlParams(pageIndex + 1);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = pageIndex;

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const pages = [];

    // Show first page
    if (totalPages > 0) {
      pages.push(1);
    }

    // Show current page and neighbors
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // Show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages.sort((a, b) => a - b);
  };

  const pageNumbers = generatePageNumbers();

  // Don't render pagination if there's no data and we're on page 1
  if (items.length === 0 && pageIndex === 1 && !hasNextPage) {
    return null;
  }

  return (
    <Pagination className={`justify-end ${className || ""}`}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={pageIndex > 1 ? buildUrl(pageIndex - 1) : "#"}
            onClick={(e) => {
              e.preventDefault();
              handlePrevPage();
            }}
            className={pageIndex === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {pageNumbers.map((pageNum, index) => {
          const showEllipsisBefore =
            index > 0 && pageNum - pageNumbers[index - 1] > 1;

          return (
            <React.Fragment key={pageNum}>
              {showEllipsisBefore && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  href={buildUrl(pageNum)}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pageNum);
                  }}
                  isActive={pageNum === pageIndex}
                  className={
                    pageNum === pageIndex
                      ? "bg-pink-500 text-white hover:bg-pink-600 hover:text-white border border-pink-500"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            </React.Fragment>
          );
        })}

        <PaginationItem>
          <PaginationNext
            href={hasNextPage ? buildUrl(pageIndex + 1) : "#"}
            onClick={(e) => {
              e.preventDefault();
              handleNextPage();
            }}
            className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
