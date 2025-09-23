import {
  Activity,
  Award,
  Building2,
  Database,
  Key,
  Lock,
  Monitor,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SecurityPage = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Security & Compliance</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Your data security is our top priority. Learn about our
            comprehensive security measures and compliance standards.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-blue-600" />
                  Data Encryption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>AES-256 encryption for data at rest</li>
                  <li>TLS 1.3 encryption for data in transit</li>
                  <li>End-to-end encryption for sensitive communications</li>
                  <li>Encrypted database backups</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-6 w-6 mr-2 text-blue-600" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>Multi-factor authentication (MFA)</li>
                  <li>Role-based access control (RBAC)</li>
                  <li>Single sign-on (SSO) support</li>
                  <li>Session management and timeout</li>
                  <li>API key authentication</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                  Multi-Tenant Isolation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>Complete data isolation between organizations</li>
                  <li>Separate subdomains for each organization</li>
                  <li>Organization-scoped API endpoints</li>
                  <li>Isolated backup and recovery</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-6 w-6 mr-2 text-blue-600" />
                  Monitoring & Auditing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>24/7 security monitoring</li>
                  <li>Comprehensive audit logs</li>
                  <li>Intrusion detection systems</li>
                  <li>Automated threat response</li>
                  <li>Regular security assessments</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-6 w-6 mr-2 text-blue-600" />
                  Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>Automated daily backups</li>
                  <li>Point-in-time recovery</li>
                  <li>Geographically distributed storage</li>
                  <li>Data retention policies</li>
                  <li>GDPR compliance tools</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-6 w-6 mr-2 text-blue-600" />
                  Compliance Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 my-6 ml-6 list-disc [&>li]:mt-2">
                  <li>SOC 2 Type II certified</li>
                  <li>GDPR compliant</li>
                  <li>PIPEDA compliant (Canada)</li>
                  <li>ISO 27001 aligned</li>
                  <li>Regular third-party audits</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Features */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Advanced Security Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Zero-Trust Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Every request is verified and authenticated regardless of
                  location or user status.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Secrets Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  API keys and secrets are encrypted and managed through secure
                  key management systems.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Real-time Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced monitoring detects and responds to security threats
                  in real-time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Security Team */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="text-center py-12">
              <h3 className="text-2xl font-bold mb-4">Security Questions?</h3>
              <p className="text-lg mb-6 opacity-90">
                Our security team is here to address your concerns and
                questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Contact Security Team
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:font-bold"
                >
                  Security Documentation
                </Button>
              </div>
              <p className="text-sm mt-4 opacity-75">
                Email: security@churchtranspo.com
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
