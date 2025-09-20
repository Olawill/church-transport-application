"use client";

import {
  Activity,
  Building2,
  DollarSign,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillingPlan, Subscription } from "@/generated/prisma";

interface PlatformAnalytics {
  overview: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalSubscriptions: number;
    monthlyRevenue: number;
  };
  growth: {
    recentOrganizations: number;
    recentUsers: number;
    organizationGrowth: number;
    userGrowth: number;
  };
  subscriptions: {
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
  };
  pickupRequests: Record<string, number>;
  topOrganizations: {
    id: string;
    name: string;
    slug: string;
    userCount: number;
    requestCount: number;
    plan: BillingPlan | undefined;
    revenue: number;
  }[];
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  contactEmail: string;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  subscription: Subscription;
  countries: {
    code: string;
    name: string;
  }[];
  stats: {
    userCount: number;
    requestCount: number;
  };
}

export const PlatformAdminDashboard = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/platform/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    }
  };

  // Fetch organizations
  const fetchOrganizations = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterPlan !== "all") params.set("plan", filterPlan);

      const response = await fetch(`/api/platform/organizations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations");
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchOrganizations();
    setLoading(false);
  }, [searchTerm, filterStatus, filterPlan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const subscriptionPlanData = {
    labels: Object.keys(analytics?.subscriptions?.byPlan || {}),
    datasets: [
      {
        data: Object.values(analytics?.subscriptions?.byPlan || {}),
        backgroundColor: [
          "#3B82F6", // Starter - Blue
          "#10B981", // Professional - Green
          "#F59E0B", // Enterprise - Amber
          "#8B5CF6", // Custom - Purple
        ],
      },
    ],
  };

  const revenueData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Monthly Revenue",
        data: [
          12000,
          15000,
          18000,
          22000,
          25000,
          analytics?.overview?.monthlyRevenue || 0,
        ],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const handleSuspendOrganization = async (orgId: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/platform/organizations/${orgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSuspended: suspend,
          suspensionReason: suspend ? "Suspended by platform admin" : null,
        }),
      });

      if (response.ok) {
        toast.success(
          `Organization ${suspend ? "suspended" : "reactivated"} successfully`
        );
        fetchOrganizations();
      } else {
        throw new Error("Failed to update organization");
      }
    } catch {
      toast.error("Failed to update organization");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Platform Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage organizations, subscriptions, and platform analytics
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview?.totalOrganizations}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.growth?.organizationGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Organizations
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview?.activeOrganizations}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                ((analytics?.overview?.activeOrganizations || 0) /
                  (analytics?.overview?.totalOrganizations || 1)) *
                100
              ).toFixed(1)}
              % active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview?.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.growth?.userGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.overview?.monthlyRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Recurring monthly revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview?.totalSubscriptions}
            </div>
            <p className="text-xs text-muted-foreground">
              Active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Organizations</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search organizations..."
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="STARTER">Starter</SelectItem>
                      <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {org.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {org.owner.firstName} {org.owner.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {org.owner.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            org.subscription?.plan === "ENTERPRISE"
                              ? "default"
                              : org.subscription?.plan === "PROFESSIONAL"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {org.subscription?.plan || "No Plan"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {org.countries.map((c) => c.name).join(", ")}
                        </div>
                      </TableCell>
                      <TableCell>{org.stats.userCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            org.isSuspended
                              ? "destructive"
                              : org.isActive
                                ? "default"
                                : "secondary"
                          }
                        >
                          {org.isSuspended
                            ? "Suspended"
                            : org.isActive
                              ? "Active"
                              : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSuspendOrganization(
                                org.id,
                                !org.isSuspended
                              )
                            }
                          >
                            {org.isSuspended ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                  Monthly recurring revenue over time
                </CardDescription>
              </CardHeader>
              <CardContent>{/* <Line data={revenueData} /> */}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>
                  Distribution of subscription plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* <Doughnut data={subscriptionPlanData} /> */}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Organizations</CardTitle>
              <CardDescription>
                Organizations by user count and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.topOrganizations?.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {org.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{org.userCount}</TableCell>
                      <TableCell>{org.requestCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        ${org.revenue?.toLocaleString() || 0}/mo
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Organization Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
          </DialogHeader>
          <CreateOrganizationForm
            onSuccess={() => {
              setShowCreateModal(false);
              fetchOrganizations();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create Organization Form Component
const CreateOrganizationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "CHURCH",
    contactEmail: "",
    ownerEmail: "",
    ownerFirstName: "",
    ownerLastName: "",
    countries: ["CA"],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/platform/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Organization created successfully");
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create organization");
      }
    } catch {
      toast.error("Failed to create organization");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData({
                ...formData,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              })
            }
            placeholder="organization-slug"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CHURCH">Church</SelectItem>
            <SelectItem value="NONPROFIT">Nonprofit</SelectItem>
            <SelectItem value="CORPORATE">Corporate</SelectItem>
            <SelectItem value="EDUCATIONAL">Educational</SelectItem>
            <SelectItem value="GOVERNMENT">Government</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) =>
            setFormData({ ...formData, contactEmail: e.target.value })
          }
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="ownerEmail">Owner Email</Label>
          <Input
            id="ownerEmail"
            type="email"
            value={formData.ownerEmail}
            onChange={(e) =>
              setFormData({ ...formData, ownerEmail: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="ownerFirstName">First Name</Label>
          <Input
            id="ownerFirstName"
            value={formData.ownerFirstName}
            onChange={(e) =>
              setFormData({ ...formData, ownerFirstName: e.target.value })
            }
          />
        </div>
        <div>
          <Label htmlFor="ownerLastName">Last Name</Label>
          <Input
            id="ownerLastName"
            value={formData.ownerLastName}
            onChange={(e) =>
              setFormData({ ...formData, ownerLastName: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Organization"}
        </Button>
      </div>
    </form>
  );
};
