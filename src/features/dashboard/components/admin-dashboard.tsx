"use client";

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  LockIcon,
  LockOpenIcon,
  Search,
  TrendingUp,
  UserCheckIcon,
  Users,
  UserXIcon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { CustomPagination } from "@/components/custom-pagination";
import { ErrorState } from "@/components/screen-states/error-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PAGINATION } from "@/config/constants";
import { adminGetUsers } from "@/features/admin/types";
import { useAdminDashboardParams } from "../hooks/use-admin-dashboard-params";

const generateChartConfig = (tooltipLabel: string, chartLabel: string) => {
  return {
    views: {
      label: tooltipLabel,
    },
    count: {
      label: chartLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;
};

export const AdminDashboard = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [params, setParams] = useAdminDashboardParams();
  const { tab, user: search, ...otherParams } = params;

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<adminGetUsers | null>(null);
  const [banReason, setBanReason] = useState("");

  const [nameInput, setNameInput] = useState(search || "");
  const [debouncedNameInput] = useDebounce(search, 300);

  const { data: stats } = useSuspenseQuery(
    trpc.adminStats.getStats.queryOptions()
  );

  const { data: usersData } = useSuspenseQuery(
    trpc.users.getPaginatedUsers.queryOptions({
      ...otherParams,
      search: debouncedNameInput || "",
    })
  );

  const { data: analytics } = useSuspenseQuery(
    trpc.adminAnalytics.getAnalytics.queryOptions()
  );

  // Logic to approve, reject, ban and unban users
  const approveUser = useMutation(
    trpc.adminUser.approveUser.mutationOptions({
      onSuccess: (data) => {
        //TODO: Send approved email to users to they can login
        toast.success(`User ${data.user.name} has been approved.`);

        queryClient.invalidateQueries(
          trpc.users.getPaginatedUsers.queryOptions({})
        );
      },
      onError: (error) => {
        toast.error(error.message || `Failed to approve user`);
      },
    })
  );

  const rejectUser = useMutation(
    trpc.adminUser.rejectUser.mutationOptions({
      onSuccess: (data) => {
        //TODO: Send reject email to users to they can login
        toast.success(`User ${data.user.name} has been rejected.`);

        queryClient.invalidateQueries(
          trpc.users.getPaginatedUsers.queryOptions({})
        );
      },
      onError: (error) => {
        toast.error(error.message || `Failed to reject user`);
      },
    })
  );

  const banUser = useMutation(
    trpc.adminUser.banUser.mutationOptions({
      onSuccess: (data) => {
        //TODO: Send reject email to users to they can login
        setBanDialogOpen(false);
        setBanReason("");
        setSelectedUser(null);
        toast.success(`User ${data.user.name}'s account has been deactivated.`);

        queryClient.invalidateQueries(
          trpc.users.getPaginatedUsers.queryOptions({})
        );
      },
      onError: (error) => {
        toast.error(error.message || `Failed to ban user`);
      },
    })
  );

  const unBanUser = useMutation(
    trpc.adminUser.unBanUser.mutationOptions({
      onSuccess: (data) => {
        //TODO: Send banned email to users to they can login
        toast.success(`User ${data.user.name}'s account has been reactivated.`);

        queryClient.invalidateQueries(
          trpc.users.getPaginatedUsers.queryOptions({})
        );
      },
      onError: (error) => {
        toast.error(error.message || `Failed to unban user`);
      },
    })
  );

  const handleNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNameInput(val); // Immediate input update

    // Update search param after debounce
    if (val !== search) {
      setTimeout(() => {
        setParams({ ...params, user: val, page: 1 });
      }, 300);
    }
  };

  const handleApproveUser = async (userId: string) => {
    await approveUser.mutateAsync({ id: userId });
  };

  const handleRejectUser = async (userId: string) => {
    await rejectUser.mutateAsync({ id: userId });
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error("Please provide a reason for banning");
      return;
    }

    await banUser.mutateAsync({ id: selectedUser.id, reason: banReason });
  };

  const handleUnbanUser = async (userId: string) => {
    await unBanUser.mutateAsync({ id: userId });
  };

  const clearFilters = () => {
    setParams({
      ...params,
      user: "",
      page: PAGINATION.DEFAULT_PAGE,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    });
    setNameInput("");
  };

  const total = useMemo(
    () => ({
      registrations: analytics?.registrations.reduce(
        (acc, reg) => acc + reg.count,
        0
      ),
      pickupRequests: analytics?.pickupRequests.reduce(
        (acc, req) => acc + req.count,
        0
      ),
    }),
    [analytics?.pickupRequests, analytics?.registrations]
  );

  const statCards = [
    {
      title: "Total Members",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: `${stats?.pendingUsers || 0} pending, ${stats?.bannedUsers || 0} banned`,
      color: "text-blue-600",
    },
    {
      title: "Pickup Requests",
      value: stats?.totalRequests || 0,
      icon: Clock,
      description: `${stats?.pendingRequests || 0} pending, ${stats?.completedRequests || 0} completed`,
      color: "text-yellow-600",
    },
    {
      title: "Completion Rate",
      value: `${stats?.completionRate || 0}%`,
      icon: CheckCircle,
      description: "Successfully completed rides",
      color: "text-green-600",
    },
    {
      title: "Active Drivers",
      value: stats?.activeDrivers || 0,
      icon: Car,
      description: `${stats?.totalDrivers || 0} total drivers`,
      color: "text-purple-600",
    },
  ];

  // Extract data from query result
  const users = usersData?.users || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = usersData?.totalPages || 1;
  const hasNextPage = usersData?.hasNextPage || false;
  const hasPreviousPage = usersData?.hasPreviousPage || false;

  const isFiltered = nameInput !== "";

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1">
          Comprehensive church transportation management and analytics
        </p>
      </div>

      <Tabs
        defaultValue={tab}
        value={tab}
        onValueChange={(value) => {
          setNameInput("");
          setParams({
            ...params,
            tab: value,
            user: "",
            page: PAGINATION.DEFAULT_PAGE,
            pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
          });
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 [&_button]:data-[state=active]:shadow-none">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div
                      className={`p-3 rounded-full bg-gray-100 ${stat.color}`}
                    >
                      <stat.icon className="size-6" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => router.push("/admin/users")}
                  >
                    <Users className="size-5 mr-3 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium">Manage Users</p>
                      <p className="text-xs text-primary/80">
                        Approve & ban users
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => router.push("/admin/services")}
                  >
                    <Calendar className="size-5 mr-3 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium">Service Schedule</p>
                      <p className="text-xs text-primary/80">
                        Configure services
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => router.push("/requests")}
                  >
                    <Car className="size-5 mr-3 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium">View Requests</p>
                      <p className="text-xs text-primary/80">Monitor pickups</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => setParams({ ...params, tab: "analytics" })}
                  >
                    <BarChart3 className="size-5 mr-3 text-orange-600" />
                    <div className="text-left">
                      <p className="font-medium">Analytics</p>
                      <p className="text-xs text-primary/80">View insights</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Latest system updates and user actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="size-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      System initialized with default data
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="size-2 bg-green-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Service days configured
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="size-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">
                      Transportation team members added
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-200 mt-4">
                    Activity log will populate as users interact with the system
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
                <CardDescription>
                  Current system status and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <Badge variant="outline" className="text-green-600">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WhatsApp API</span>
                    <Badge variant="outline" className="text-yellow-600">
                      Setup Required
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Service</span>
                    <Badge variant="outline" className="text-yellow-600">
                      Setup Required
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Users</span>
                    <Badge variant="outline">
                      {stats?.activeUsers || 0} online
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-start gap-1 px-6 pb-3 sm:pb-0">
                  <CardTitle className="flex items-center">
                    <TrendingUp className="size-5 mr-2" />
                    User Registrations (Last 30 Days)
                  </CardTitle>
                </div>
                <div>
                  {["registrations"].map((key) => {
                    const chart = key as keyof typeof total;
                    return (
                      <div
                        key={chart}
                        className="bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-2 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-3"
                      >
                        <span className="text-muted-foreground text-xs">
                          Total Registrations
                        </span>
                        <span className="text-lg leading-none font-bold sm:text-3xl text-primary">
                          {total[chart]?.toLocaleString() || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent>
                {analytics.registrations.length === 0 ? (
                  <ErrorState
                    title="Registrations"
                    description="No user registrations in the last 30 days for your organization"
                  />
                ) : (
                  <ChartContainer
                    config={generateChartConfig(
                      "Registrations",
                      "30 days View"
                    )}
                    className="aspect-auto h-[250px] w-full"
                  >
                    <LineChart
                      accessibilityLayer
                      data={analytics?.registrations}
                      margin={{
                        left: 12,
                        right: 12,
                        top: 8,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          });
                        }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="w-[150px]"
                            nameKey="views"
                            labelFormatter={(value) => {
                              return new Date(value).toLocaleDateString(
                                "en-CA",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  timeZone: "UTC",
                                }
                              );
                            }}
                          />
                        }
                      />
                      <Line
                        // dataKey={activeChart}
                        dataKey={"count"}
                        type="monotone"
                        // stroke={`var(--color-${activeChart})`}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-start gap-1 px-6 pb-3 sm:pb-0">
                  <CardTitle className="flex items-center">
                    <Activity className="size-5 mr-2" />
                    Pickup Requests (Last 30 Days)
                  </CardTitle>
                </div>
                <div>
                  {["pickupRequests"].map((key) => {
                    const chart = key as keyof typeof total;
                    return (
                      <div
                        key={chart}
                        className="bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-2 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-3"
                      >
                        <span className="text-muted-foreground text-xs">
                          Total Requests
                        </span>
                        <span className="text-lg leading-none font-bold sm:text-3xl text-primary">
                          {total[chart]?.toLocaleString() || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent>
                {/* <Line data={requestsChartData} height={100} /> */}
                {analytics.pickupRequests.length === 0 ? (
                  <ErrorState
                    title="Ride Requests"
                    description="No ride requests in the last 30 days for your organization"
                  />
                ) : (
                  <ChartContainer
                    config={generateChartConfig("Requests", "30 days View")}
                    className="aspect-auto h-[250px] w-full"
                  >
                    <LineChart
                      accessibilityLayer
                      data={analytics?.pickupRequests}
                      margin={{
                        left: 12,
                        right: 12,
                        top: 8,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          });
                        }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="w-[150px]"
                            nameKey="views"
                            labelFormatter={(value) => {
                              return new Date(value).toLocaleDateString(
                                "en-CA",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  timeZone: "UTC",
                                }
                              );
                            }}
                          />
                        }
                      />
                      <Line
                        // dataKey={activeChart}
                        dataKey={"count"}
                        type="monotone"
                        // stroke={`var(--color-${activeChart})`}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Driver Activity</CardTitle>
                <CardDescription>
                  Top performing drivers this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.driverActivity.slice(0, 5).map((driver) => (
                    <div
                      key={driver.driverId}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{driver.driverName}</p>
                        <p className="text-sm text-gray-600">
                          {driver.acceptances} accepted, {driver.completions}{" "}
                          completed, {driver.cancellations} cancelled
                        </p>
                      </div>
                      <Badge variant="outline">
                        {driver.completions > 0
                          ? Math.round(
                              (driver.completions / driver.acceptances) * 100
                            )
                          : 0}
                        % rate
                      </Badge>
                    </div>
                  ))}

                  {analytics.driverActivity.length === 0 && (
                    <p className="text-center">
                      No driver activities this month
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Service Days</CardTitle>
                <CardDescription>Most requested services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.popularServiceDays.slice(0, 5).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{service.name}</p>
                      </div>
                      <Badge variant="outline">
                        {service.requestCount} requests
                      </Badge>
                    </div>
                  ))}

                  {analytics.popularServiceDays.length === 0 && (
                    <p className="text-center">No ride requests this month</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                User Management
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={nameInput}
                      onChange={handleNameFilterChange}
                      className="pl-9 w-64"
                    />
                    {isFiltered && (
                      <XCircleIcon
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 cursor-pointer"
                        onClick={clearFilters}
                      />
                    )}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === "ADMIN"
                              ? "text-red-600"
                              : user.role === "TRANSPORTATION_TEAM"
                                ? "text-blue-600"
                                : "text-gray-600 dark:text-gray-400"
                          }
                        >
                          {user.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "APPROVED"
                              ? "default"
                              : user.status === "PENDING"
                                ? "secondary"
                                : user.status === "BANNED"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {(user.status === "PENDING" ||
                            user.status === "REJECTED") && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveUser(user.id)}
                                >
                                  <UserCheckIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-background text-foreground">
                                Approve User
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {user.status === "PENDING" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleRejectUser(user.id)}
                                >
                                  <UserXIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-background text-foreground">
                                Reject User
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {user.status !== "BANNED" &&
                            user.status !== "PENDING" &&
                            user.status !== "REJECTED" &&
                            user.role !== "ADMIN" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setBanDialogOpen(true);
                                    }}
                                  >
                                    <LockIcon className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-background text-foreground">
                                  Ban User
                                </TooltipContent>
                              </Tooltip>
                            )}
                          {user.status === "BANNED" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnbanUser(user.id)}
                                  >
                                    <LockOpenIcon className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-background text-foreground">
                                  Unban User
                                </TooltipContent>
                              </Tooltip>

                              {user.banReason && (
                                <Badge variant="outline" className="text-xs">
                                  {user.banReason}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {users.length === 0 && (
                    <TableRow>
                      <TableCell
                        className="font-medium text-center"
                        colSpan={6}
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <CustomPagination
                currentPage={otherParams.page}
                totalItems={totalCount}
                itemsPerPage={otherParams.pageSize}
                onPageChange={(newPage) =>
                  setParams({ ...params, page: newPage })
                }
                onItemsPerPageChange={(newPageSize) => {
                  setParams({ ...params, pageSize: newPageSize, page: 1 });
                }}
                itemName="users"
                className="w-full"
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
              />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="size-4 mr-2" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                Manage organization subscriptions and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  Multi-tenant subscription management will be implemented in
                  the enhanced version. Currently operating in
                  single-organization mode.
                </AlertDescription>
              </Alert>

              <div className="mt-6 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Current Organization</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-200">
                      Free for Life
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Only Admin users can ban users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">User</Label>
              <p className="text-sm">
                {selectedUser?.name} ({selectedUser?.email})
              </p>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="banReason">
                Reason for Ban
              </Label>
              <Textarea
                id="banReason"
                className="resize-none"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Please provide a reason for banning this user..."
                rows={3}
              />
            </div>
            {/* <DialogFooter>

            </DialogFooter> */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBanUser}>
                Ban User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
