import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsPage = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: January 1, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                By accessing or using ChurchTranspo (&quot;Service&quot;), you
                agree to be bound by these Terms of Service (&quot;Terms&quot;).
                If you disagree with any part of these terms, you may not access
                the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                ChurchTranspo provides a multi-tenant platform for organizations
                to manage transportation services including:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Pickup request management</li>
                <li>Route optimization</li>
                <li>Driver coordination</li>
                <li>User management and communications</li>
                <li>Reporting and analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                User Accounts and Organizations
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Organization Registration</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                Organizations must register through our platform and receive
                approval before accessing services. Each organization receives a
                unique subdomain.
              </p>

              <h4>User Responsibilities</h4>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the service only for lawful purposes</li>
                <li>Comply with your organization&apos;s policies</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Subscription and Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Subscription Plans</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We offer various subscription plans with different features and
                usage limits. All plans include a 14-day free trial.
              </p>

              <h4>Billing Terms</h4>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Subscriptions renew automatically</li>
                <li>Payments are processed through Stripe</li>
                <li>Refunds are subject to our refund policy</li>
                <li>Price changes will be communicated 30 days in advance</li>
              </ul>

              <h4>Usage Limits</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                Each plan has specific limits for users, drivers, requests, and
                features. Exceeding limits may result in service restrictions or
                additional charges.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Data and Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>Data Ownership</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                You retain ownership of your organization&apos;s data. We
                provide tools for data export and deletion.
              </p>

              <h4>Data Security</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We implement industry-standard security measures to protect your
                data. However, no system is 100% secure.
              </p>

              <h4>Multi-Tenant Isolation</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                Your organization&apos;s data is isolated from other
                organizations on our platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Acceptable Use</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                You agree not to:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Use the service for illegal activities</li>
                <li>Attempt to breach security measures</li>
                <li>Interfere with other users or organizations</li>
                <li>Reverse engineer or copy our software</li>
                <li>Use the service to send spam or malicious content</li>
                <li>Share account credentials with unauthorized users</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                ChurchTranspo shall not be liable for:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Service interruptions or data loss</li>
                <li>Actions or omissions of drivers or users</li>
                <li>Third-party service failures</li>
              </ul>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                Our total liability shall not exceed the amount paid for the
                service in the 12 months preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4>By You</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                You may terminate your subscription at any time through the
                dashboard. Access continues until the end of the billing period.
              </p>

              <h4>By Us</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We may suspend or terminate accounts for:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Violation of these terms</li>
                <li>Non-payment of fees</li>
                <li>Illegal or harmful activities</li>
                <li>Abuse of the platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                For questions about these Terms of Service, contact us at:
              </p>
              <div className="mt-4">
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  <strong>Email:</strong> legal@churchtranspo.com
                </p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  <strong>Address:</strong> ChurchTranspo Legal Team
                  <br />
                  123 Main Street
                  <br />
                  Toronto, ON M5V 3A8
                  <br />
                  Canada
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
