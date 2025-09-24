"use client";

import {
  CheckCircle,
  Filter,
  Mail,
  MapPin,
  Phone,
  UserCog,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useConfirm } from "@/hooks/use-confirm";
import { AnalyticsService } from "@/lib/analytics";
import { User } from "@/lib/types";

export const UserManagement = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [UpdateRoleDialog, confirmUpdateRole] = useConfirm(
    "Change role",
    "Are you sure you want to change this member's role?",
    true
  );

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") {
        params.set("role", roleFilter);
      }
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        toast.success(`User ${newStatus.toLowerCase()} successfully`);
        fetchUsers();

        if (session?.user) {
          // Track analytics
          await AnalyticsService.trackEvent({
            eventType: "user_approval",
            userId,
            metadata: { approvedBy: session.user.id },
          });
        }
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An error occurred");
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    const ok = await confirmUpdateRole();

    if (!ok) return;

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      if (response.ok) {
        toast.success("User role updated successfully");
        fetchUsers();
      } else {
        toast.error("Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "TRANSPORTATION_TEAM":
        return "bg-blue-100 text-blue-800";
      case "USER":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const pendingUsers = users.filter((u) => u.status === "PENDING").length;
  const approvedUsers = users.filter((u) => u.status === "APPROVED").length;
  const transportationMembers = users.filter(
    (u) => u.role === "TRANSPORTATION_TEAM"
  ).length;

  return (
    <>
      <UpdateRoleDialog />

      <div className="space-y-6">
        <div className="flex flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="mt-1">
              Manage user registrations, roles, and account status
            </p>
          </div>

          <Button asChild>
            <Link href="/admin/users/new" aria-label="Create new user">
              <UserPlus className="size-4" />
              <span>New User</span>
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Pending Approval</p>
                  <p className="text-2xl font-bold">{pendingUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Approved Users</p>
                  <p className="text-2xl font-bold">{approvedUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Drivers</p>
                  <p className="text-2xl font-bold">{transportationMembers}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TRANSPORTATION_TEAM">
                      Transportation Team
                    </SelectItem>
                    <SelectItem value="USER">Regular Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users</CardTitle>
            <CardDescription>
              {statusFilter === "PENDING" && "Users pending approval"}
              {statusFilter === "APPROVED" && "Approved and active users"}
              {statusFilter === "REJECTED" && "Rejected user accounts"}
              {statusFilter === "ALL" && "All registered users"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-6 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No users match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                        {user.addresses && user.addresses[0] && (
                          <div className="flex items-center space-x-1 mt-1 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {user.addresses[0].street},{" "}
                              {user.addresses[0].city},{" "}
                              {user.addresses[0].province}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status.toLowerCase()}
                        </Badge>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.toLowerCase().replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        {user.status === "PENDING" && (
                          <>
                            <Button
                              onClick={() =>
                                handleStatusUpdate(user.id, "APPROVED")
                              }
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                handleStatusUpdate(user.id, "REJECTED")
                              }
                              size="sm"
                              variant="outline"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {user.status === "APPROVED" &&
                          user.id !== session?.user.id &&
                          session?.user.role === "ADMIN" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                  <UserCog className="size-4" />
                                  Change role
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56">
                                <DropdownMenuLabel>ROLES</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup
                                  value={user.role}
                                  onValueChange={(value) => {
                                    handleRoleUpdate(user.id, value);
                                  }}
                                >
                                  <DropdownMenuRadioItem value="ADMIN">
                                    Admin
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="TRANSPORTATION_TEAM">
                                    Transportation
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="USER">
                                    User
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
