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
  pageIndex: number; // 1-based indexing
  total: number;
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
  
  const { items, pageIndex, pageSize, total } = data;
  
  // Calculate if there are more pages
  const hasNextPage = pageIndex * pageSize < total;
  const totalPages = Math.ceil(total / pageSize);

  const buildUrl = (newPageIndex: number, newPageSize?: number) => {
    const params = new URLSearchParams(searchParams);
    const targetPageSize = newPageSize || pageSize;
    
    // Remove params if they are default values (page 1, pageSize 20)
    if (newPageIndex === 1 && targetPageSize === 20) {
      params.delete('page');
      params.delete('pageSize');
    } else {
      if (newPageIndex === 1) {
        params.delete('page');
      } else {
        params.set('page', newPageIndex.toString());
      }
      
      if (targetPageSize === 20) {
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
    if (pageIndex > 1) {
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
    const currentPage = pageIndex; // Already 1-based
    
    // Always show page 1
    pages.push(1);
    
    // Show current page if it's not 1
    if (currentPage > 1 && !pages.includes(currentPage)) {
      pages.push(currentPage);
    }
    
    // Show next page only if hasNextPage is true
    if (hasNextPage && !pages.includes(currentPage + 1)) {
      pages.push(currentPage + 1);
    }
    
    return pages.sort((a, b) => a - b);
  };

  const pageNumbers = generatePageNumbers();

  // Don't render pagination if there's no data and we're on page 1
  if (items.length === 0 && pageIndex === 1 && !hasNextPage) {
    return null;
  }

  return (
    <Pagination className={className}>
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
        
        {pageNumbers.map((pageNum) => (
          <PaginationItem key={pageNum}>
            <PaginationLink
              href={buildUrl(pageNum)}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(pageNum);
              }}
              isActive={pageNum === pageIndex}
            >
              {pageNum}
            </PaginationLink>
          </PaginationItem>
        ))}
        
        {hasNextPage && pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1] < pageIndex + 2 && (
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