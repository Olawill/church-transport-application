"use client";

import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  FileTextIcon,
  FilterIcon,
  Loader2Icon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { AppealStatus } from "@/generated/prisma/enums";
import { formatDate } from "date-fns";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useAppealParams } from "../../hooks/use-appeal-params";
import { useDebounce } from "use-debounce";
import { PAGINATION } from "@/config/constants";
import { CustomPagination } from "@/components/custom-pagination";
import Link from "next/link";
import { CreateAppealType } from "../../lib/types";
import { toast } from "sonner";

export const AppealDecisionView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [params, setParams] = useAppealParams();
  const { page, pageSize, search, status } = params;

  const [selectedAppeal, setSelectedAppeal] = useState<CreateAppealType | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState(search || "");
  const [debouncedSearch] = useDebounce(search, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val); // Immediate input update

    // Update search param after debounce
    if (val !== search) {
      setTimeout(() => {
        setParams({ ...params, search: val, page: 1 });
      }, 300);
    }
  };

  // email functiom
  const sendEmail = useMutation(
    trpc.emails.sendMail.mutationOptions({
      onSuccess: () => {
        toast.success("Email sent successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send email");
      },
    })
  );

  // Logic for getting and updating appeals
  const { data: appealData, isLoading: appealDataLoading } = useSuspenseQuery(
    trpc.appeal.getAppealedUser.queryOptions({
      search: debouncedSearch || "",
      page,
      pageSize,
      status,
    })
  );

  // approve
  const approveAppeal = useMutation(
    trpc.appeal.approveAppeal.mutationOptions({
      onSuccess: async () => {
        // TODO: Send email to client
        toast.success("Appeal approved successfully.");
        queryClient.invalidateQueries(
          trpc.appeal.getAppealedUser.queryOptions({
            search: debouncedSearch || "",
            page,
            pageSize,
            status,
          })
        );
        setIsSheetOpen(false);
        await sendEmail.mutateAsync({
          to: selectedAppeal?.email as string,
          type: "appeal_status",
          name: selectedAppeal?.user.name as string,
          status: "approved",
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to approve appeal.");
      },
    })
  );

  // reject
  const rejectAppeal = useMutation(
    trpc.appeal.rejectAppeal.mutationOptions({
      onSuccess: async () => {
        toast.success("Appeal rejected successfully.");
        queryClient.invalidateQueries(
          trpc.appeal.getAppealedUser.queryOptions({
            search: debouncedSearch || "",
            page,
            pageSize,
            status,
          })
        );
        setIsSheetOpen(false);
        await sendEmail.mutateAsync({
          to: selectedAppeal?.email as string,
          type: "appeal_status",
          name: selectedAppeal?.user.name as string,
          status: "rejected",
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reject appeal.");
      },
    })
  );

  // under review
  const reviewAppeal = useMutation(
    trpc.appeal.reviewAppeal.mutationOptions({
      onSuccess: async () => {
        toast.success("Appeal status changed to under review.");
        queryClient.invalidateQueries(
          trpc.appeal.getAppealedUser.queryOptions({
            search: debouncedSearch || "",
            page,
            pageSize,
            status,
          })
        );
        setIsSheetOpen(false);
        await sendEmail.mutateAsync({
          to: selectedAppeal?.email as string,
          type: "appeal_status",
          name: selectedAppeal?.user.name as string,
          status: "review",
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reject appeal.");
      },
    })
  );

  const statusConfig = {
    PENDING: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: ClockIcon,
    },
    UNDER_REVIEW: {
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: EyeIcon,
    },
    APPROVED: {
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircleIcon,
    },
    REJECTED: {
      color: "bg-red-100 text-red-800 border-red-300",
      icon: XCircleIcon,
    },
  };

  const handleViewAppeal = (appeal: CreateAppealType) => {
    setSelectedAppeal(appeal);
    setReviewNotes(appeal.reviewNotes || "");
    setIsSheetOpen(true);
  };

  const handleStatusChange = async (newStatus: AppealStatus) => {
    if (!selectedAppeal) return;

    if (newStatus === "APPROVED") {
      await approveAppeal.mutateAsync({
        id: selectedAppeal.id,
        reviewNotes,
      });
    }

    if (newStatus === "REJECTED") {
      await rejectAppeal.mutateAsync({
        id: selectedAppeal.id,
        reviewNotes,
      });
    }

    if (newStatus === "UNDER_REVIEW") {
      await reviewAppeal.mutateAsync({
        id: selectedAppeal.id,
        reviewNotes,
      });
    }
  };

  const clearFilters = () => {
    setParams({
      ...params,
      search: "",
      page: PAGINATION.DEFAULT_PAGE,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    });
    setSearchQuery("");
  };

  const isFiltered = searchQuery !== "";

  const StatusIcon = selectedAppeal
    ? statusConfig[selectedAppeal.status].icon
    : ClockIcon;

  // Extract data from query result
  const filteredAppeals = appealData?.appeals || [];
  const totalCount = appealData?.totalCount || 0;
  const totalPages = appealData?.totalPages || 1;
  const hasNextPage = appealData?.hasNextPage || false;
  const hasPreviousPage = appealData?.hasPreviousPage || false;

  const statusCounts = filteredAppeals.reduce(
    (acc, appeal) => {
      acc[appeal.status] = (acc[appeal.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const stats = Object.values(AppealStatus).map((status) => ({
    name: status,
    value: statusCounts[status] || 0,
  }));

  const isSubmitting =
    approveAppeal.isPending || rejectAppeal.isPending || reviewAppeal.isPending;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Appeal Management</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Review and manage user registration appeals
        </p>
      </div>

      {/* Filters */}
      <div className="bg-accent rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:justify-between w-full">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
              />
              {isFiltered && (
                <XCircleIcon
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 cursor-pointer"
                  onClick={clearFilters}
                />
              )}
            </div>
          </div>
          <div>
            <Select
              value={status}
              onValueChange={(value) =>
                setParams({ ...params, status: value as AppealStatus })
              }
            >
              <SelectTrigger className="w-full">
                <FilterIcon className="size-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map((status) => {
          const Icon = statusConfig[status.name].icon;
          return (
            <div
              key={status.name}
              className="bg-accent rounded-lg shadow-sm border p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{status.name.replace("_", " ")}</p>
                  {appealDataLoading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <p className="text-2xl font-bold">{status.value}</p>
                  )}
                </div>
                <Icon className="size-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-accent rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No Appeals found
                </TableCell>
              </TableRow>
            ) : appealDataLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2Icon className="size-4 animate-spin" />
                </TableCell>
              </TableRow>
            ) : (
              filteredAppeals.map((appeal) => {
                const StatusIcon = statusConfig[appeal.status].icon;
                const linkedEmail = "mailto:" + appeal.email;
                return (
                  <TableRow key={appeal.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm">{appeal.user.name}</p>
                        <Link
                          href={{ pathname: linkedEmail }}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-blue-400 hover:underline text-balance"
                        >
                          {appeal.email}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusConfig[appeal.status].color} flex items-center gap-1 w-fit`}
                      >
                        <StatusIcon className="size-3" />
                        {appeal.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarIcon className="size-3" />
                        {formatDate(appeal.createdAt, "PP h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAppeal(appeal)}
                      >
                        <EyeIcon className="size-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <CustomPagination
          currentPage={params.page}
          totalItems={totalCount}
          itemsPerPage={params.pageSize}
          onPageChange={(newPage) => setParams({ ...params, page: newPage })}
          onItemsPerPageChange={(newPageSize) => {
            setParams({ ...params, pageSize: newPageSize, page: 1 });
          }}
          itemName="appeals"
          className="w-full"
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
        />
      </div>

      {/* Review Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto px-8 py-4">
          {selectedAppeal && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileTextIcon className="size-5" />
                  Appeal Review
                </SheetTitle>
                <SheetDescription>
                  Review and make a decision on this appeal
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* User Info */}
                <div className="bg-accent rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    User Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="grid grid-cols-3">
                      <span className="text-gray-600 dark:text-gray-200 col-span-1">
                        Name:
                      </span>{" "}
                      <span className="font-medium">
                        {selectedAppeal.user.name}
                      </span>
                    </p>
                    <p className="grid grid-cols-3">
                      <span className="text-gray-600 dark:text-gray-200 col-span-1">
                        Email:
                      </span>{" "}
                      <span className="font-medium">
                        {selectedAppeal.email}
                      </span>
                    </p>
                    <p className="grid grid-cols-3">
                      <span className="text-gray-600 dark:text-gray-200 col-span-1">
                        Submitted:
                      </span>{" "}
                      <span className="font-medium">
                        {formatDate(selectedAppeal.createdAt, "PP h:mm a")}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Current Status */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">
                    Current Status
                  </h3>
                  <Badge
                    variant="outline"
                    className={`${statusConfig[selectedAppeal.status].color} flex items-center gap-1 w-fit`}
                  >
                    <StatusIcon className="size-3" />
                    {selectedAppeal.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Appeal Reason */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-300 mb-2">
                    Reason for Appeal
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200 bg-accent rounded-lg p-4">
                    {selectedAppeal.reason}
                  </p>
                </div>

                {/* Additional Info */}
                {selectedAppeal.additionalInfo && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-300 mb-2">
                      Additional Information
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-200 bg-accent rounded-lg p-4">
                      {selectedAppeal.additionalInfo}
                    </p>
                  </div>
                )}

                {/* Review History */}
                {selectedAppeal.reviewedBy && (
                  <Alert>
                    <AlertDescription>
                      <p className="text-sm">
                        <strong>Reviewed by:</strong>{" "}
                        {selectedAppeal.reviewedBy}
                      </p>
                      {selectedAppeal.reviewedAt && (
                        <p className="text-sm">
                          <strong>Reviewed at:</strong>{" "}
                          {formatDate(selectedAppeal.reviewedAt, "PP h:mm a")}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Review Notes */}
                <div>
                  <label className="block font-semibold text-gray-900 dark:text-gray-300 mb-2">
                    Review Notes
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    rows={4}
                    className="resize-none border-accent"
                    disabled={
                      selectedAppeal.status === "REJECTED" ||
                      selectedAppeal.status === "APPROVED"
                    }
                  />
                </div>

                {/* Decision Buttons */}
                <div className="space-y-3 pt-4 border-t border-accent">
                  {(selectedAppeal.status === "PENDING" ||
                    selectedAppeal.status === "UNDER_REVIEW") && (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                      Make a Decision
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedAppeal.status === "PENDING" && (
                      <Button
                        onClick={() => handleStatusChange("UNDER_REVIEW")}
                        variant="outline"
                        disabled={isSubmitting}
                        className="w-full cursor-pointer col-span-2"
                      >
                        {reviewAppeal.isPending ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <EyeIcon className="size-4" />
                        )}
                        Mark as Under Review
                      </Button>
                    )}

                    {(selectedAppeal.status === "PENDING" ||
                      selectedAppeal.status === "UNDER_REVIEW") && (
                      <Button
                        onClick={() => handleStatusChange("APPROVED")}
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 cursor-pointer col-span-2"
                      >
                        {approveAppeal.isPending ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <CheckCircleIcon className="size-4" />
                        )}
                        Approve Appeal
                      </Button>
                    )}
                  </div>
                  {(selectedAppeal.status === "PENDING" ||
                    selectedAppeal.status === "UNDER_REVIEW") && (
                    <Button
                      onClick={() => handleStatusChange("REJECTED")}
                      variant="destructive"
                      disabled={isSubmitting}
                      className="w-full cursor-pointer"
                    >
                      {rejectAppeal.isPending ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <XCircleIcon className="size-4" />
                      )}
                      Reject Appeal
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
