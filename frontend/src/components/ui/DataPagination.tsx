"use client";

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
  pageIndex: number;
  hasNextPage: boolean;
}

export interface DataPaginationProps<T> {
  data: PaginatedResponse<T>;
  className?: string;
}

export default function DataPagination<T>({ 
  data, 
  className 
}: DataPaginationProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const { items, pageIndex, pageSize, hasNextPage } = data;

  const buildUrl = (newPageIndex: number, newPageSize?: number) => {
    const params = new URLSearchParams(searchParams);
    const targetPageSize = newPageSize || pageSize;
    const displayPage = newPageIndex + 1; // Convert to 1-based for URL
    
    // Remove params if they are default values (page 1, pageSize 10)
    if (displayPage === 1 && targetPageSize === 10) {
      params.delete('page');
      params.delete('pageSize');
    } else {
      if (displayPage === 1) {
        params.delete('page');
      } else {
        params.set('page', displayPage.toString());
      }
      
      if (targetPageSize === 10) {
        params.delete('pageSize');
      } else {
        params.set('pageSize', targetPageSize.toString());
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
    if (pageIndex > 0) {
      updateUrlParams(pageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      updateUrlParams(pageIndex + 1);
    }
  };

  // Generate page numbers to display based on actual data
  const generatePageNumbers = () => {
    const pages = [];
    const currentPage = pageIndex + 1; // Convert to 1-based for display
    
    // Only show page 1 if we're not on it or if there's actually data
    if (currentPage === 1 || items.length > 0) {
      pages.push(1);
    }
    
    // Show current page if it's not 1
    if (currentPage > 1) {
      pages.push(currentPage);
    }
    
    // Show next page only if hasNextPage is true
    if (hasNextPage && !pages.includes(currentPage + 1)) {
      pages.push(currentPage + 1);
    }
    
    return pages.sort((a, b) => a - b);
  };

  const pageNumbers = generatePageNumbers();

  // Don't render pagination if there's no data and we're on page 0
  if (items.length === 0 && pageIndex === 0 && !hasNextPage) {
    return null;
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href={pageIndex > 0 ? buildUrl(pageIndex - 1) : "#"}
            onClick={(e) => {
              e.preventDefault();
              handlePrevPage();
            }}
            className={pageIndex === 0 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        
        {pageNumbers.map((pageNum) => (
          <PaginationItem key={pageNum}>
            <PaginationLink
              href={buildUrl(pageNum - 1)} // Convert to 0-based for buildUrl
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(pageNum - 1); // Convert back to 0-based
              }}
              isActive={pageNum === pageIndex + 1}
            >
              {pageNum}
            </PaginationLink>
          </PaginationItem>
        ))}
        
        {hasNextPage && pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1] < pageIndex + 3 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        
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