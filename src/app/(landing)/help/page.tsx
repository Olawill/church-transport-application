import { Book, Mail, MessageCircle, Phone, Search, Video } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I register my organization?",
        answer:
          "Visit our registration page and fill out the organization details. Our team will review and approve your application within 1-2 business days.",
      },
      {
        question: "What happens after approval?",
        answer:
          "Once approved, you'll receive login credentials and access to your organization's subdomain (e.g., yourorg.churchtranspo.com).",
      },
      {
        question: "How do I add team members?",
        answer:
          "As an admin, you can invite team members through the dashboard. They'll receive email invitations to join your organization.",
      },
    ],
  },
  {
    category: "Subscriptions & Billing",
    questions: [
      {
        question: "How does the free trial work?",
        answer:
          "All plans include a 14-day free trial with full access to features. No credit card required to start.",
      },
      {
        question: "Can I change plans later?",
        answer:
          "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.",
      },
      {
        question: "What is the SMS add-on?",
        answer:
          "SMS notifications are available as an add-on to any plan. Pricing varies by plan and includes a monthly credit allowance.",
      },
    ],
  },
  {
    category: "Features",
    questions: [
      {
        question: "How does route optimization work?",
        answer:
          "Our AI-powered system calculates the most efficient routes for drivers, minimizing travel time and fuel costs.",
      },
      {
        question: "Can I customize the platform for my organization?",
        answer:
          "Yes! Professional and Enterprise plans include custom branding options like colors, logos, and domain customization.",
      },
      {
        question: "What integrations are available?",
        answer:
          "We support Google Maps, WhatsApp Business API, various SMS providers, and OAuth with Google and Facebook.",
      },
    ],
  },
];

const supportOptions = [
  {
    title: "Documentation",
    description: "Comprehensive guides and tutorials",
    icon: Book,
    href: "/documentation",
    badge: "Free",
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video guides",
    icon: Video,
    href: "/tutorials",
    badge: "Free",
  },
  {
    title: "Email Support",
    description: "Get help via email (48h response)",
    icon: Mail,
    href: "mailto:support@churchtranspo.com",
    badge: "All Plans",
  },
  {
    title: "Priority Support",
    description: "24h response time",
    icon: MessageCircle,
    href: "/contact",
    badge: "Professional+",
  },
  {
    title: "Phone Support",
    description: "Direct phone assistance",
    icon: Phone,
    href: "/contact",
    badge: "Enterprise",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-xl mb-8 opacity-90">
            Find answers, get support, and learn how to make the most of
            ChurchTranspo
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles..."
              className="pl-12 py-6 text-lg bg-white text-white placeholder:text-white/70"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Support Options */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Get Support</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {supportOptions.map((option, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <option.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <Badge variant="outline">{option.badge}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-full">
                  <p className="text-gray-600 dark:text-gray-200 mb-4">
                    {option.description}
                  </p>
                  <Link href={{ pathname: option.href }}>
                    <Button variant="outline" size="sm" className="w-full">
                      Access
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-2xl font-semibold mb-4 text-blue-600">
                  {category.category}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={faqIndex.toString()}>
                      <AccordionTrigger className="text-[15px]">
                        {/* <HelpCircle className="size-5 mr-2 text-blue-600" /> */}
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-balance">
                        <p className="text-gray-600 text-[16px]">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
            <p className="text-lg mb-6 opacity-90">
              Our support team is here to help you succeed
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Contact Support
                </Button>
              </Link>
              <Link href="/documentation">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:font-bold"
                >
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
