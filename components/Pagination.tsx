"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { PaginationProps } from "@/types/global"

const Pager = ({ totalPages, currentPage = 1, isNoPostFound }: PaginationProps) => {
  const pagesToShow = 3;
  const startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  const endPage = Math.min(startPage + pagesToShow - 1, totalPages);
  const isFirstPage = currentPage === 1
  const isLastpage = currentPage === totalPages

  // Enhanced click handler to prevent same-page requests
  const handlePageClick = (page: number, event: React.MouseEvent) => {
    if (page === currentPage) {
      event.preventDefault()
      return
    }
  }

  return (
    <Pagination>
      <PaginationContent>
      {isFirstPage || isNoPostFound ? (
        <PaginationItem>
          <PaginationPrevious className="cursor-not-allowed" href="#" isActive={false} />
        </PaginationItem>
      ) : (
        <PaginationItem>
          <PaginationPrevious href={`/blog?page=${currentPage - 1}`} isActive />
        </PaginationItem>
      )}

      {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
        const page = startPage + i
        const isCurrentPage = page === currentPage

        return <PaginationItem key={i}>
          <PaginationLink
            href={isCurrentPage ? "#" : `/blog?page=${page}`}
            isActive={isCurrentPage}
            onClick={(e) => handlePageClick(page, e)}
            className={isCurrentPage ? "cursor-default" : ""}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      })}

      {isLastpage || isNoPostFound ? (
        <PaginationItem>
          <PaginationNext
            className="cursor-not-allowed"
            href="#"
            isActive={false}
          />
        </PaginationItem>
      ) : (
        <PaginationItem>
          <PaginationNext href={`/blog?page=${currentPage + 1}`} isActive />
        </PaginationItem>
      )}
      </PaginationContent>
    </Pagination>
  )
}

export default Pager