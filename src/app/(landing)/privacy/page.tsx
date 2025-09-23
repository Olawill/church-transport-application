import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: January 1, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              {/* scroll-m-20 text-xl font-semibold tracking-tight */}
              <h4 className="text-xl font-semibold tracking-tight">
                Personal Information
              </h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                When you register for ChurchTranspo, we collect:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Name and contact information (email, phone number)</li>
                <li>Organization details and role</li>
                <li>Address information for pickup requests</li>
                <li>Payment information (processed securely through Stripe)</li>
              </ul>

              <h4 className="text-xl font-semibold tracking-tight">
                Usage Data
              </h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We automatically collect:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>
                  Log data including IP address, browser type, and pages visited
                </li>
                <li>Usage analytics and performance metrics</li>
                <li>Location data for route optimization (with permission)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We use your information to:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Provide and improve our transportation services</li>
                <li>Process pickup requests and coordinate rides</li>
                <li>Send service notifications and updates</li>
                <li>Handle billing and payment processing</li>
                <li>Provide customer support</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Data Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="text-xl font-semibold tracking-tight">
                Within Your Organization
              </h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                Your information is shared with authorized members of your
                organization including administrators and transportation team
                members for service coordination.
              </p>

              <h4 className="text-xl font-semibold tracking-tight mt-6">
                Third-Party Services
              </h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We share limited data with:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>
                  Google Maps for route optimization and location services
                </li>
                <li>Stripe for secure payment processing</li>
                <li>SMS and email providers for notifications</li>
                <li>WhatsApp Business API for messaging (if enabled)</li>
              </ul>

              <h4 className="text-xl font-semibold tracking-tight">
                Legal Requirements
              </h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We may disclose information when required by law, court order,
                or to protect our rights and safety.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                We implement industry-standard security measures:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>AES-256 encryption for sensitive data at rest</li>
                <li>TLS encryption for data in transit</li>
                <li>Multi-factor authentication for admin accounts</li>
                <li>Regular security audits and monitoring</li>
                <li>Secure data centers with 24/7 monitoring</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                You have the right to:
              </p>
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of non-essential communications</li>
                <li>Withdraw consent for location tracking</li>
              </ul>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                To exercise these rights, contact us at
                privacy@churchtranspo.com
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                For privacy-related questions, contact us at:
              </p>
              <div className="mt-4">
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  <strong>Email:</strong> privacy@churchtranspo.com
                </p>
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  <strong>Address:</strong> ChurchTranspo Privacy Team
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

export default PrivacyPage;
