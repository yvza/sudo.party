import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { PaginationProps } from "@/types/global"

const Pager = ({ totalPages, currentPage = 1 }: PaginationProps) => {
  const pagesToShow = 3;
  const startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  const endPage = Math.min(startPage + pagesToShow - 1, totalPages);

  return (
    <Pagination>
      <PaginationContent>
      {currentPage === 1 ? (
        <PaginationItem>
          <PaginationPrevious
            className="cursor-not-allowed"
            href="#"
            isActive={false}
            scroll={false}
          />
        </PaginationItem>
      ) : (
        <PaginationItem>
          <PaginationPrevious
            href={{
              pathname: "/blog",
              query: { page: currentPage - 1 }
            }}
            isActive
          />
        </PaginationItem>
      )}

      {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
        const page = startPage + i;
        return <PaginationItem key={i}>
          <PaginationLink
            href={{
              pathname: "/blog",
              query: { page }
            }}
            isActive={currentPage === page}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      })}

      {currentPage === totalPages ? (
        <PaginationItem>
          <PaginationNext
            className="cursor-not-allowed"
            href="#"
            isActive={false}
            scroll={false}
          />
        </PaginationItem>
      ) : (
        <PaginationItem>
          <PaginationNext
            href={{
              pathname: "/blog",
              query: { page: currentPage + 1 }
            }}
            isActive
          />
        </PaginationItem>
      )}
      </PaginationContent>
    </Pagination>
  )
}

export default Pager