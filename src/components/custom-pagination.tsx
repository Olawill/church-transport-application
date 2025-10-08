"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CustomPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemName?: string; // e.g., "users", "requests", "services"
  className?: string;
}

export const CustomPagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemName = "items",
  className,
}: CustomPaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t",
        className
      )}
    >
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">Show</span>
        <Select
          value={itemsPerPage === totalItems ? "all" : itemsPerPage.toString()}
          onValueChange={(value) => {
            const newItemsPerPage =
              value === "all" ? totalItems : parseInt(value);
            onItemsPerPageChange(newItemsPerPage);
            // Reset to page 1 when changing items per page
            onPageChange(1);
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="40">40</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {itemsPerPage === totalItems ? itemName : "per page"}
        </span>
      </div>

      {/* Page info */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> {itemName}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={!canGoPrevious}
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => {
            if (pageNum === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                  ...
                </span>
              );
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(pageNum as number)}
                className="w-10"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Current page indicator for mobile */}
        <div className="sm:hidden px-3 py-2 text-sm font-medium">
          {currentPage} / {totalPages}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!canGoNext}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={!canGoNext}
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Hook for managing pagination state
export const usePagination = (initialItemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const paginateItems = <T,>(items: T[]): T[] => {
    if (itemsPerPage >= items.length) {
      return items; // Show all items
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    paginateItems,
    resetPage,
  };
};

// Hook for managing pagination with filters
export const usePaginationWithFilters = <
  TFilters extends Record<string, unknown>,
>(
  initialItemsPerPage: number = 10,
  initialFilters: TFilters
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  const paginateItems = <TItem,>(items: TItem[]): TItem[] => {
    if (itemsPerPage >= items.length) {
      return items; // Show all items
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const resetPage = () => setCurrentPage(1);

  // Update a single filter and reset to page 1
  const updateFilter = <K extends keyof TFilters>(
    key: K,
    value: TFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Update multiple filters at once and reset to page 1
  const updateFilters = (newFilters: Partial<TFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters and reset to page 1
  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  // Override items per page change to also reset page
  const handleItemsPerPageChange = (newItemsPerPage: number): void => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return {
    currentPage,
    itemsPerPage,
    filters,
    setCurrentPage,
    setItemsPerPage: handleItemsPerPageChange,
    paginateItems,
    resetPage,
    updateFilter,
    updateFilters,
    clearFilters,
  };
};

// Hook for managing pagination with external store filters (like Zustand)
export const usePaginationWithStore = (
  initialItemsPerPage: number = 10,
  filterDependencies: unknown[] = [] // Pass filter values from store to track changes
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, filterDependencies);

  const paginateItems = <TItem,>(items: TItem[]): TItem[] => {
    if (itemsPerPage >= items.length) {
      return items; // Show all items
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const resetPage = (): void => setCurrentPage(1);

  // Override items per page change to also reset page
  const handleItemsPerPageChange = (newItemsPerPage: number): void => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage: handleItemsPerPageChange,
    paginateItems,
    resetPage,
  };
};
