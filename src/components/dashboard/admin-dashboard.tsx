"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  Search,
  TrendingUp,
  Users,
  UserX,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  CustomPagination,
  usePaginationWithFilters,
} from "../custom-pagination";

// import { DashboardStats } from "@/lib/types";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  bannedUsers: number;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  cancelledRequests: number;
  totalDrivers: number;
  activeDrivers: number;
  completionRate: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  bannedAt?: string;
  banReason?: string;
}

interface AnalyticsData {
  registrations: Array<{ date: string; count: number }>;
  pickupRequests: Array<{ date: string; count: number }>;
  driverActivity: Array<{
    driverId: string;
    driverName: string;
    acceptances: number;
    completions: number;
    cancellations: number;
  }>;
  popularServiceDays: Array<{ id: string; name: string; requestCount: number }>;
}

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

type UserFilters = {
  searchQuery: string;
};

export const AdminDashboard = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentTab, setCurrentTab] = useState("overview");

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");

  const {
    currentPage,
    itemsPerPage,
    filters,
    setCurrentPage,
    setItemsPerPage,
    paginateItems,
    updateFilter,
    clearFilters,
  } = usePaginationWithFilters<UserFilters>(20, {
    searchQuery: "",
  });

  useEffect(() => {
    Promise.all([fetchStats(), fetchUsers(), fetchAnalytics()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "PUT",
      });

      if (response.ok) {
        await fetchUsers();
        await fetchStats();
        toast.success("User approved successfully");
      } else {
        toast.error("Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Error approving user");
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast.error("Please provide a reason for banning");
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason }),
      });

      if (response.ok) {
        await fetchUsers();
        await fetchStats();
        setBanDialogOpen(false);
        setBanReason("");
        setSelectedUser(null);
        toast.success("User banned successfully");
      } else {
        toast.error("Failed to ban user");
      }
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Error banning user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: "PUT",
      });

      if (response.ok) {
        await fetchUsers();
        await fetchStats();
        toast.success("User unbanned successfully");
      } else {
        toast.error("Failed to unban user");
      }
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Error unbanning user");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.firstName
        .toLowerCase()
        .includes(filters.searchQuery.toLowerCase()) ||
        user.lastName
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.searchQuery.toLowerCase())) &&
      user.id !== session?.user.id
  );

  // Get paginated users
  const paginatedUsers = paginateItems(filteredUsers);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      return;
    }

    const totalPages =
      Math.ceil(filteredUsers.length / itemsPerPage) === 0
        ? 1
        : Math.ceil(filteredUsers.length / itemsPerPage);

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, filteredUsers.length, itemsPerPage, setCurrentPage]);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

  // const registrationChartData = {
  //   labels: analytics?.registrations.map((item) => item.date) || [],
  //   datasets: [
  //     {
  //       label: "New Registrations",
  //       data: analytics?.registrations.map((item) => item.count) || [],
  //       borderColor: "rgb(59, 130, 246)",
  //       backgroundColor: "rgba(59, 130, 246, 0.1)",
  //       tension: 0.4,
  //     },
  //   ],
  // };

  // const requestsChartData = {
  //   labels: analytics?.pickupRequests.map((item) => item.date) || [],
  //   datasets: [
  //     {
  //       label: "Pickup Requests",
  //       data: analytics?.pickupRequests.map((item) => item.count) || [],
  //       borderColor: "rgb(34, 197, 94)",
  //       backgroundColor: "rgba(34, 197, 94, 0.1)",
  //       tension: 0.4,
  //     },
  //   ],
  // };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1">
          Comprehensive church transportation management and analytics
        </p>
      </div>

      <Tabs
        defaultValue={currentTab}
        value={currentTab}
        onValueChange={setCurrentTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
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
                      <stat.icon className="h-6 w-6" />
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
                {/* <a
                  href="/admin/users"
                  className="block p-4 rounded-lg border hover:bg-gray-50 dark:hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Manage Users</p>
                      <p className="text-sm text-gray-600">
                        Approve registrations and manage member accounts
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/admin/services"
                  className="block p-4 rounded-lg border hover:bg-gray-50 dark:hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Service Schedule</p>
                      <p className="text-sm text-gray-600">
                        Configure service days and times
                      </p>
                    </div>
                  </div>
                </a>
                <a
                  href="/requests"
                  className="block p-4 rounded-lg border hover:bg-gray-50 dark:hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">View All Requests</p>
                      <p className="text-sm text-gray-600">
                        Monitor pickup requests and assignments
                      </p>
                    </div>
                  </div>
                </a> */}

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
                    onClick={() => setCurrentTab("analytics")}
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
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">
                      System initialized with default data
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-gray-600">
                      Service days configured
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-600">
                      Transportation team members added
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
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
                    <TrendingUp className="h-5 w-5 mr-2" />
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
                <ChartContainer
                  config={generateChartConfig("Registrations", "30 days View")}
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
                            return new Date(value).toLocaleDateString("en-CA", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            });
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-start gap-1 px-6 pb-3 sm:pb-0">
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
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
                            return new Date(value).toLocaleDateString("en-CA", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "UTC",
                            });
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
                      value={filters.searchQuery}
                      onChange={(e) =>
                        updateFilter("searchQuery", e.target.value)
                      }
                      className="pl-9 w-64"
                    />
                    {filters.searchQuery && (
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
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
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
                          {user.status === "PENDING" && (
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(user.id)}
                            >
                              Approve
                            </Button>
                          )}
                          {user.status !== "BANNED" &&
                            user.role !== "ADMIN" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBanDialogOpen(true);
                                }}
                                title="Ban User"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            )}
                          {user.status === "BANNED" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Unban User"
                                onClick={() => handleUnbanUser(user.id)}
                              >
                                Unban
                              </Button>
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

                  {paginatedUsers.length === 0 && (
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
                currentPage={currentPage}
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemName="users"
                className="w-full"
              />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                Manage organization subscriptions and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
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
                    <p className="text-sm text-gray-600">Free for Life</p>
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
            <div>
              <Label>User</Label>
              <p className="text-sm">
                {selectedUser?.firstName}
                {selectedUser?.lastName}({selectedUser?.email})
              </p>
            </div>
            <div>
              <Label htmlFor="banReason">Reason for Ban</Label>
              <Textarea
                id="banReason"
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
