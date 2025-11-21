"use client";

import {
  Activity,
  Building2,
  Check,
  Crown,
  DollarSign,
  Gift,
  Key,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
  X,
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
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { BillingPlan, Subscription } from "@/generated/prisma";

interface PlatformAnalytics {
  overview: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalSubscriptions: number;
    monthlyRevenue: number;
    pendingRegistrations: number;
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
  topOrganizations: {
    id: string;
    name: string;
    slug: string;
    userCount: number;
    requestCount: number;
    plan: BillingPlan | undefined;
    revenue: number;
    isFreeForLife: boolean;
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
  isFreeForLife: boolean;
  freeForLifeReason?: string;
  freeForLifeGrantedBy?: string;
  freeForLifeGrantedAt?: string;
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
interface OrganizationRegistration {
  id: string;
  organizationName: string;
  slug: string;
  type: string;
  contactEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  selectedPlan: string;
  selectedCountries: string;
  status: string;
  createdAt: string;
  referralSource?: string;
}

export const PlatformAdminDashboard = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [registrations, setRegistrations] = useState<
    OrganizationRegistration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFreeForLifeModal, setShowFreeForLifeModal] = useState(false);
  const [showSecretsModal, setShowSecretsModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  // Free for life form
  const [freeForLifeForm, setFreeForLifeForm] = useState({
    reason: "",
    grantedFor: "performance", // performance, sponsorship, charity, testing
  });

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

  // Fetch pending registrations
  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/platform/registrations");
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to load registrations");
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchOrganizations();
    fetchRegistrations();
    setLoading(false);
  }, [searchTerm, filterStatus, filterPlan]);

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
        toast.error("Failed to update organization status");
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("An error occurred");
    }
  };

  const handleGrantFreeForLife = async () => {
    if (!selectedOrganization) return;

    try {
      const response = await fetch(
        `/api/platform/organizations/${selectedOrganization.id}/free-for-life`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(freeForLifeForm),
        }
      );

      if (response.ok) {
        toast.success("Free for life access granted successfully!");
        setShowFreeForLifeModal(false);
        setSelectedOrganization(null);
        setFreeForLifeForm({ reason: "", grantedFor: "performance" });
        fetchOrganizations();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to grant free access");
      }
    } catch (error) {
      console.error("Error granting free access:", error);
      toast.error("An error occurred");
    }
  };

  const handleApproveRegistration = async (
    registrationId: string,
    approved: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/platform/registrations/${registrationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: approved ? "APPROVED" : "REJECTED",
            rejectionReason: approved ? null : "Rejected by platform admin",
          }),
        }
      );

      if (response.ok) {
        toast.success(
          `Registration ${approved ? "approved" : "rejected"} successfully`
        );
        fetchRegistrations();
        if (approved) fetchOrganizations();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to process registration");
      }
    } catch (error) {
      console.error("Error processing registration:", error);
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Platform Administration
          </h1>
          <p className="text-gray-600">
            Manage organizations, subscriptions, and platform settings
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Platform Settings
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview?.totalOrganizations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.growth?.recentOrganizations || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.growth?.recentUsers || 0} this month
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
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Registrations
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.overview?.pendingRegistrations || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="registrations">
            Registrations
            {registrations.filter((r) => r.status === "PENDING").length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {registrations.filter((r) => r.status === "PENDING").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                Manage all organizations on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="free">Free for Life</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
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
                          <div className="font-medium flex items-center">
                            {org.name}
                            {org.isFreeForLife && (
                              <Button
                                size="icon"
                                title="Free for Life"
                                variant="ghost"
                              >
                                <Crown className="h-4 w-4 text-yellow-500 ml-2" />
                              </Button>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {org.slug}.actsOnWheels.com
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
                        <Badge variant="outline">
                          {org.subscription?.plan || "No Plan"}
                        </Badge>
                      </TableCell>
                      <TableCell>{org.stats.userCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={org.isActive ? "default" : "secondary"}
                          >
                            {org.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {org.isSuspended && (
                            <Badge variant="destructive">Suspended</Badge>
                          )}
                          {org.isFreeForLife && (
                            <Badge
                              variant="outline"
                              className="text-yellow-600"
                            >
                              Free for Life
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrganization(org);
                              setShowSecretsModal(true);
                            }}
                            title="Manage Secrets"
                          >
                            <Key className="h-4 w-4" />
                          </Button>

                          {!org.isFreeForLife && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrganization(org);
                                setShowFreeForLifeModal(true);
                              }}
                              title="Grant Free for Life"
                            >
                              <Gift className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleSuspendOrganization(
                                org.id,
                                !org.isSuspended
                              )
                            }
                            title={org.isSuspended ? "Reactivate" : "Suspend"}
                          >
                            {org.isSuspended ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
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

        {/* Registrations Tab */}
        <TabsContent value="registrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Registrations</CardTitle>
              <CardDescription>
                Review and approve new organization registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {registration.organizationName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {registration.slug}.actsOnWheels.com
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {registration.type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {registration.ownerFirstName}{" "}
                            {registration.ownerLastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {registration.ownerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {registration.selectedPlan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {JSON.parse(registration.selectedCountries).join(
                            ", "
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            registration.status === "PENDING"
                              ? "secondary"
                              : registration.status === "APPROVED"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {registration.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {registration.status === "PENDING" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApproveRegistration(registration.id, true)
                              }
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleApproveRegistration(
                                  registration.id,
                                  false
                                )
                              }
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Organizations</CardTitle>
                <CardDescription>
                  Organizations by revenue and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics?.topOrganizations?.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium">{org.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {org.slug}
                              </div>
                            </div>
                            {org.isFreeForLife && (
                              <Crown className="h-4 w-4 text-yellow-500 ml-2" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{org.userCount}</TableCell>
                        <TableCell>
                          {org.isFreeForLife ? (
                            <Badge
                              variant="outline"
                              className="text-yellow-600"
                            >
                              Free
                            </Badge>
                          ) : (
                            `${org.revenue?.toLocaleString() || 0}/mo`
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
                <CardDescription>
                  Plans and subscription status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics?.subscriptions?.byPlan || {}).map(
                    ([plan, count]) => (
                      <div
                        key={plan}
                        className="flex justify-between items-center"
                      >
                        <span className="font-medium">{plan}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Free for Life Modal */}
      <Dialog
        open={showFreeForLifeModal}
        onOpenChange={setShowFreeForLifeModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Free for Life Access</DialogTitle>
            <DialogDescription>
              Grant {selectedOrganization?.name} free Enterprise-level access
              for life
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="grantedFor">Reason for Grant</Label>
              <Select
                value={freeForLifeForm.grantedFor}
                onValueChange={(value) =>
                  setFreeForLifeForm((prev) => ({ ...prev, grantedFor: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">
                    Outstanding Performance
                  </SelectItem>
                  <SelectItem value="sponsorship">
                    Sponsorship Agreement
                  </SelectItem>
                  <SelectItem value="charity">
                    Charitable Organization
                  </SelectItem>
                  <SelectItem value="partnership">
                    Strategic Partnership
                  </SelectItem>
                  <SelectItem value="testing">Beta Testing Program</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Additional Notes</Label>
              <Textarea
                id="reason"
                value={freeForLifeForm.reason}
                onChange={(e) =>
                  setFreeForLifeForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Provide additional context for this grant..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFreeForLifeModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleGrantFreeForLife}>
                <Crown className="h-4 w-4 mr-2" />
                Grant Free Access
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Organization Secrets Modal */}
      <Dialog open={showSecretsModal} onOpenChange={setShowSecretsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Organization Secrets - {selectedOrganization?.name}
            </DialogTitle>
            <DialogDescription>
              Manage API keys and secrets for this organization
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Organization secrets management will be implemented next. This
              will include Google Maps API, OAuth credentials, WhatsApp secrets,
              and more.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {showCreateModal && (
        <CreateOrganizationForm
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOrganizations();
          }}
        />
      )}
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
