import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ListingPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function ListingPagination({
  page,
  totalPages,
  onPageChange,
}: ListingPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1)
    .reduce<Array<number | "ellipsis">>((items, value, index, visible) => {
      if (index > 0 && value - visible[index - 1] > 1) items.push("ellipsis");
      items.push(value);
      return items;
    }, []);

  return (
    <nav
      aria-label="Listing pages"
      className="flex flex-wrap items-center justify-center gap-2 pt-5"
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      {pages.map((value, index) =>
        value === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={value === page ? "default" : "outline"}
            aria-current={value === page ? "page" : undefined}
            onClick={() => onPageChange(value)}
            className="min-w-9"
          >
            {value}
          </Button>
        ),
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <span className="w-full text-center text-xs text-muted-foreground sm:w-auto sm:pl-2">
        Page {page} of {totalPages}
      </span>
    </nav>
  );
}
