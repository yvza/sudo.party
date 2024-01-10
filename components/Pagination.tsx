import Link from "next/link";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Props {
  totalPages: number
  currentPage?: number
}

const Pager = ({ totalPages, currentPage = 1 }: Props) => {
  const pagesToShow = 3;
  const startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  const endPage = Math.min(startPage + pagesToShow - 1, totalPages);

  return (
    <div className="flex gap-6">
      {currentPage === 1 ? (
        <button
          disabled
          className="cursor-not-allowed">
            Prev
        </button>
      ) : (
        <Link
          href={{
            pathname: "/blog",
            query: { page: currentPage - 1 }
          }}
        >
          Prev
        </Link>
      )}

      {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
        const page = startPage + i;
        return <Link
          key={i}
          href={{
            pathname: "/blog",
            query: { page }
          }}
          className={`${
            currentPage === page
            ? "bg-blue-500 rounded-full w-8 text-center text-white"
            : "bg-gray-200 rounded-full w-8 text-center text-gray-500"
          }`}
        >
          {page}
        </Link>
      })}

      {currentPage === totalPages ? (
        <button
          disabled
          className="cursor-not-allowed"
        >
          Next
        </button>
      ) : (
        <Link
          href={{
            pathname: "/blog",
            query: { page: currentPage + 1 }
          }}
        >
          Next
        </Link>
      )}
    </div>
  )
}

export default Pager