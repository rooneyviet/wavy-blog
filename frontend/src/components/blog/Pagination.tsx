import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g., "/blog/page"
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  basePath,
}) => {
  const pageNumbers = [];
  const maxPagesToShow = 5;

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push(-1); // Ellipsis marker
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(-1); // Ellipsis marker
      }
      pageNumbers.push(totalPages);
    }
  }

  return (
    <div className="mt-12 flex justify-center items-center space-x-2">
      {currentPage > 1 && (
        <Link
          href={`${basePath}/${currentPage - 1}`}
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-pink-100 hover:text-pink-600 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      )}

      {pageNumbers.map((page, index) =>
        page === -1 ? (
          <span key={`ellipsis-${index}`} className="text-gray-500">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={`${basePath}/${page}`}
            className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-colors ${
              currentPage === page
                ? "text-white bg-pink-500"
                : "text-gray-600 hover:bg-pink-100 hover:text-pink-600"
            }`}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={`${basePath}/${currentPage + 1}`}
          className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-pink-100 hover:text-pink-600 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />{" "}
        </Link>
      )}
    </div>
  );
};

export default Pagination;
