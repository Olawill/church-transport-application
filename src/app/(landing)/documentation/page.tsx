import { Code, MessageCircle, Search, Video } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DocumentationPage = () => {
  const sections = [
    {
      title: "Getting Started",
      description: "Quick start guides and basic setup",
      articles: [
        { title: "Organization Registration", href: "/docs/registration" },
        { title: "Initial Setup", href: "/docs/setup" },
        { title: "Adding Team Members", href: "/docs/team-setup" },
        { title: "First Pickup Request", href: "/docs/first-request" },
      ],
    },
    {
      title: "User Management",
      description: "Managing users, roles, and permissions",
      articles: [
        { title: "User Roles & Permissions", href: "/docs/user-roles" },
        { title: "Adding Users", href: "/docs/add-users" },
        { title: "Driver Management", href: "/docs/drivers" },
        { title: "User Approval Process", href: "/docs/user-approval" },
      ],
    },
    {
      title: "Transportation Features",
      description: "Pickup requests, routing, and scheduling",
      articles: [
        { title: "Creating Pickup Requests", href: "/docs/pickup-requests" },
        { title: "Route Optimization", href: "/docs/routing" },
        { title: "Service Schedules", href: "/docs/schedules" },
        { title: "Driver Assignment", href: "/docs/driver-assignment" },
      ],
    },
    {
      title: "Communications",
      description: "Notifications and messaging features",
      articles: [
        { title: "Email Notifications", href: "/docs/email" },
        { title: "SMS Setup", href: "/docs/sms" },
        { title: "WhatsApp Integration", href: "/docs/whatsapp" },
        { title: "Push Notifications", href: "/docs/push" },
      ],
    },
    {
      title: "Integrations",
      description: "Third-party service integrations",
      articles: [
        { title: "Google Maps Setup", href: "/docs/google-maps" },
        { title: "OAuth Configuration", href: "/docs/oauth" },
        { title: "WhatsApp Business API", href: "/docs/whatsapp-api" },
        { title: "Custom Integrations", href: "/docs/custom" },
      ],
    },
    {
      title: "Billing & Subscriptions",
      description: "Managing plans, billing, and usage",
      articles: [
        { title: "Subscription Plans", href: "/docs/plans" },
        { title: "Billing Management", href: "/docs/billing" },
        { title: "Usage Monitoring", href: "/docs/usage" },
        { title: "Plan Upgrades", href: "/docs/upgrades" },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl mb-8 opacity-90">
            Comprehensive guides to help you get the most out of ActsOnWheels
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search documentation..."
              className="pl-12 py-6 text-lg bg-white text-white placeholder:text-white/70"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Quick Links */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Popular Articles</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Quick Start Guide</h3>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  Get up and running in 5 minutes
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">API Reference</h3>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  Complete API documentation
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">WhatsApp Setup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  Configure WhatsApp notifications
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Troubleshooting</h3>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  Common issues and solutions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid lg:grid-cols-2 gap-8">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.articles.map((article, articleIndex) => (
                    <Link
                      key={articleIndex}
                      href={{ pathname: article.href }}
                      className="block p-2 rounded hover:bg-gray-50 text-blue-600 hover:text-blue-700"
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="h-6 w-6 mr-2 text-blue-600" />
                  Video Tutorials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Step-by-step video guides for common tasks
                </p>
                <Link href="/tutorials">
                  <Button variant="outline" size="sm">
                    Watch Videos
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-6 w-6 mr-2 text-blue-600" />
                  API Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Complete API documentation and examples
                </p>
                <Link href="/api-docs">
                  <Button variant="outline" size="sm">
                    View API Docs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-6 w-6 mr-2 text-blue-600" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Connect with other ActsOnWheels users
                </p>
                <Link href="/community">
                  <Button variant="outline" size="sm">
                    Join Community
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
