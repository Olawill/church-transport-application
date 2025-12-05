"use client";

import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  FileTextIcon,
  FilterIcon,
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

import { Appeal } from "@/generated/prisma/browser";
import { AppealStatus } from "@/generated/prisma/enums";
import { formatDate } from "date-fns";

// Mock data - replace with your tRPC query
const mockAppeals: Appeal[] = [
  {
    id: "appeal_1a2b3c4d",
    email: "john.doe@example.com",
    reason:
      "I believe my application was rejected due to a misunderstanding about my qualifications. I have 5 years of experience in the field and have completed all necessary certifications. I would appreciate a reconsideration of my application.",
    additionalInfo:
      "I can provide additional references from my previous employers and copies of my certifications if needed. I have attached my updated resume with more detailed information about my work history.",
    status: "PENDING",
    userId: "user_john_123",
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date("2024-01-20T10:30:00Z"),
    updatedAt: new Date("2024-01-20T10:30:00Z"),
  },
  {
    id: "appeal_2e3f4g5h",
    email: "jane.smith@example.com",
    reason:
      "The rejection seems to be based on incomplete information. I submitted all required documents including proof of address and identification, but perhaps they were not properly reviewed.",
    additionalInfo: null,
    status: "PENDING",
    userId: "user_jane_456",
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date("2024-01-19T14:20:00Z"),
    updatedAt: new Date("2024-01-19T14:20:00Z"),
  },
  {
    id: "appeal_3i4j5k6l",
    email: "bob.wilson@example.com",
    reason:
      "I was not aware of the deadline extension and submitted my application late by just 2 hours. I had all my documents ready but faced technical difficulties during submission. Can this be reconsidered given the circumstances?",
    additionalInfo:
      "I have screenshots showing the error messages I received during the submission process. The system was experiencing high traffic at that time.",
    status: "UNDER_REVIEW",
    userId: "user_bob_789",
    reviewedBy: "Admin Sarah Johnson",
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date("2024-01-18T09:15:00Z"),
    updatedAt: new Date("2024-01-20T11:45:00Z"),
  },
  {
    id: "appeal_4m5n6o7p",
    email: "alice.brown@example.com",
    reason:
      "My background check was flagged incorrectly. The issue mentioned in the rejection was from a case of mistaken identity. I have court documents proving that the records do not pertain to me.",
    additionalInfo:
      "Attached are official court documents and a letter from my attorney clarifying the mistaken identity issue. I can provide additional documentation from law enforcement if required.",
    status: "UNDER_REVIEW",
    userId: "user_alice_012",
    reviewedBy: "Admin Michael Chen",
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date("2024-01-17T16:45:00Z"),
    updatedAt: new Date("2024-01-19T10:20:00Z"),
  },
  {
    id: "appeal_5q6r7s8t",
    email: "david.martinez@example.com",
    reason:
      "I believe the rejection was due to an outdated address on my application. I have since moved and can provide current proof of residence. All other qualifications meet your requirements.",
    additionalInfo:
      "Current utility bill and lease agreement attached showing my new address within the service area.",
    status: "APPROVED",
    userId: "user_david_345",
    reviewedBy: "Admin Sarah Johnson",
    reviewedAt: new Date("2024-01-19T13:30:00Z"),
    reviewNotes:
      "Approved after verification of new address. User meets all requirements and has clean background check. Welcome email sent.",
    createdAt: new Date("2024-01-16T11:20:00Z"),
    updatedAt: new Date("2024-01-19T13:30:00Z"),
  },
  {
    id: "appeal_6u7v8w9x",
    email: "emily.davis@example.com",
    reason:
      "The system rejected my application stating insufficient experience, but I have 7 years of relevant experience in the industry. Perhaps my resume formatting caused the automated system to miss this information.",
    additionalInfo: null,
    status: "APPROVED",
    userId: "user_emily_678",
    reviewedBy: "Admin Michael Chen",
    reviewedAt: new Date("2024-01-18T15:45:00Z"),
    reviewNotes:
      "Verified work experience manually. User has extensive relevant experience. System error in automated screening. Account activated.",
    createdAt: new Date("2024-01-15T09:30:00Z"),
    updatedAt: new Date("2024-01-18T15:45:00Z"),
  },
  {
    id: "appeal_7y8z9a0b",
    email: "michael.johnson@example.com",
    reason:
      "I failed to upload my driver's license properly during registration. The file was corrupted. I am ready to resubmit with a clear, valid copy.",
    additionalInfo:
      "High-resolution scans of both front and back of my driver's license are ready for upload.",
    status: "REJECTED",
    userId: "user_michael_901",
    reviewedBy: "Admin Sarah Johnson",
    reviewedAt: new Date("2024-01-17T14:20:00Z"),
    reviewNotes:
      "License submitted in appeal is expired. User needs to renew their driver's license before reapplying. Advised to submit new application once license is renewed.",
    createdAt: new Date("2024-01-14T13:40:00Z"),
    updatedAt: new Date("2024-01-17T14:20:00Z"),
  },
  {
    id: "appeal_8c9d0e1f",
    email: "sarah.anderson@example.com",
    reason:
      "My application was rejected due to a low credit score, but this was caused by identity theft which I have since resolved. I have documentation from the credit bureaus showing the fraudulent accounts have been removed.",
    additionalInfo:
      "Police report filed for identity theft (Case #2024-001234), letters from Equifax, Experian, and TransUnion confirming fraud resolution and score correction. Updated credit report showing improved score attached.",
    status: "REJECTED",
    userId: "user_sarah_234",
    reviewedBy: "Admin Michael Chen",
    reviewedAt: new Date("2024-01-16T16:00:00Z"),
    reviewNotes:
      "While we sympathize with the identity theft situation, current credit score still doesn't meet minimum requirements. Recommend reapplying in 6 months after further credit rebuilding.",
    createdAt: new Date("2024-01-13T10:15:00Z"),
    updatedAt: new Date("2024-01-16T16:00:00Z"),
  },
  {
    id: "appeal_9g0h1i2j",
    email: "thomas.white@example.com",
    reason:
      "Technical error during registration caused my phone number to be recorded incorrectly. This led to failed verification attempts. My actual phone number is valid and can be verified.",
    additionalInfo:
      "Correct phone number: +1-555-0123. I am available for immediate verification call.",
    status: "PENDING",
    userId: "user_thomas_567",
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date("2024-01-21T08:00:00Z"),
    updatedAt: new Date("2024-01-21T08:00:00Z"),
  },
  {
    id: "appeal_0k1l2m3n",
    email: "lisa.thompson@example.com",
    reason:
      "My professional license was listed as expired in your system, but it was actually renewed 2 months ago. The state registry may not have updated immediately. I have my renewed license certificate.",
    additionalInfo:
      "Renewed professional license certificate issued by the state board on November 15, 2023. License number: PL-123456-2027 (valid through 2027).",
    status: "PENDING",
    userId: "user_lisa_890",
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date("2024-01-20T15:30:00Z"),
    updatedAt: new Date("2024-01-20T15:30:00Z"),
  },
  {
    id: "appeal_4o5p6q7r",
    email: "james.garcia@example.com",
    reason:
      "The address verification failed because I recently moved and my ID still shows my old address. I have multiple forms of proof for my current residence.",
    additionalInfo:
      "Utility bills for the past 3 months, signed lease agreement, and a letter from my landlord confirming my tenancy at the current address.",
    status: "UNDER_REVIEW",
    userId: "user_james_123",
    reviewedBy: "Admin Sarah Johnson",
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date("2024-01-19T12:10:00Z"),
    updatedAt: new Date("2024-01-20T09:15:00Z"),
  },
  {
    id: "appeal_8s9t0u1v",
    email: "maria.rodriguez@example.com",
    reason:
      "My application was rejected for insufficient vehicle insurance, but my insurance was active at the time of application. There may have been a delay in the verification system.",
    additionalInfo:
      "Current insurance card and declaration page from my insurance company showing continuous coverage since 2020. Insurance agent contact: John Smith, 555-0198.",
    status: "APPROVED",
    userId: "user_maria_456",
    reviewedBy: "Admin Michael Chen",
    reviewedAt: new Date("2024-01-20T10:30:00Z"),
    reviewNotes:
      "Insurance verified directly with the provider. Coverage is valid and meets all requirements. User is approved and account has been activated.",
    createdAt: new Date("2024-01-18T14:25:00Z"),
    updatedAt: new Date("2024-01-20T10:30:00Z"),
  },
];

export const AppealDecisionView = () => {
  const [appeals, setAppeals] = useState<Appeal[]>(mockAppeals);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppealStatus | "ALL">(
    "PENDING"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const filteredAppeals = appeals.filter((appeal) => {
    const matchesStatus =
      statusFilter === "ALL" || appeal.status === statusFilter;
    const matchesSearch = appeal.email
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleViewAppeal = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
    setReviewNotes(appeal.reviewNotes || "");
    setIsSheetOpen(true);
  };

  const handleStatusChange = async (newStatus: AppealStatus) => {
    if (!selectedAppeal) return;

    setIsSubmitting(true);

    try {
      // Replace with your tRPC mutation
      // await updateAppealMutation.mutateAsync({
      //   appealId: selectedAppeal.id,
      //   status: newStatus,
      //   reviewNotes,
      // });

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      setAppeals((prev) =>
        prev.map((appeal) =>
          appeal.id === selectedAppeal.id
            ? {
                ...appeal,
                status: newStatus,
                reviewNotes,
                reviewedAt: new Date(),
                reviewedBy: "Current Admin",
              }
            : appeal
        )
      );

      setSelectedAppeal((prev) =>
        prev ? { ...prev, status: newStatus, reviewNotes } : null
      );

      alert(`Appeal ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      alert("Failed to update appeal. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "short",
  //     day: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  // };

  const StatusIcon = selectedAppeal
    ? statusConfig[selectedAppeal.status].icon
    : ClockIcon;

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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as AppealStatus | "ALL")
              }
            >
              <SelectTrigger>
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
        {(
          ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as AppealStatus[]
        ).map((status) => {
          const count = appeals.filter((a) => a.status === status).length;
          const Icon = statusConfig[status].icon;
          return (
            <div
              key={status}
              className="bg-accent rounded-lg shadow-sm border p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{status.replace("_", " ")}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <Icon className="size-8" />
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
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No appeals found
                </TableCell>
              </TableRow>
            ) : (
              filteredAppeals.map((appeal) => {
                const StatusIcon = statusConfig[appeal.status].icon;
                return (
                  <TableRow key={appeal.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm">{appeal.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 max-w-sm">
                        {appeal.reason}
                      </p>
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
                        {formatDate(appeal.createdAt, "PP HH:mm")}
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
                    <p>
                      <span className="text-gray-600 dark:text-gray-200">
                        Email:
                      </span>{" "}
                      <span className="font-medium">
                        {selectedAppeal.email}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600 dark:text-gray-200">
                        Submitted:
                      </span>{" "}
                      <span className="font-medium">
                        {formatDate(selectedAppeal.createdAt, "PP HH:mm")}
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
                          {formatDate(selectedAppeal.reviewedAt, "PP HH:mm")}
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
                  />
                </div>

                {/* Decision Buttons */}
                <div className="space-y-3 pt-4 border-t border-accent">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                    Make a Decision
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleStatusChange("UNDER_REVIEW")}
                      variant="outline"
                      disabled={isSubmitting}
                      className="w-full cursor-pointer"
                    >
                      <EyeIcon className="size-4" />
                      Mark Under Review
                    </Button>
                    <Button
                      onClick={() => handleStatusChange("APPROVED")}
                      disabled={isSubmitting}
                      className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
                    >
                      <CheckCircleIcon className="size-4" />
                      Approve Appeal
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleStatusChange("REJECTED")}
                    variant="destructive"
                    disabled={isSubmitting}
                    className="w-full cursor-pointer"
                  >
                    <XCircleIcon className="size-4" />
                    Reject Appeal
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
