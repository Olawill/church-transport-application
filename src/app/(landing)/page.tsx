"use client";

import {
  ArrowRight,
  Check,
  Globe,
  MapPin,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Smart Route Optimization",
    description:
      "AI-powered routing to minimize travel time and maximize efficiency",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Multi-Organization Support",
    description:
      "Each organization gets their own branded subdomain and customization",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Enterprise Security",
    description:
      "Bank-grade security with multi-factor authentication and data encryption",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Coverage",
    description: "Support for multiple countries with localized features",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Real-time Tracking",
    description: "Live tracking with WhatsApp and SMS notifications",
  },
];

const plans = [
  {
    name: "Starter",
    price: 29,
    description: "Perfect for small organizations getting started",
    features: [
      "Up to 100 users",
      "Basic route optimization",
      "Email notifications",
      "1 country support",
      "Standard support",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: 79,
    description: "Ideal for growing organizations with advanced needs",
    features: [
      "Up to 500 users",
      "Advanced route optimization",
      "WhatsApp & SMS notifications",
      "Up to 3 countries",
      "Priority support",
      "Custom branding",
      "Analytics dashboard",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 199,
    description: "Full-featured solution for large organizations",
    features: [
      "Unlimited users",
      "AI-powered optimization",
      "All notification channels",
      "Unlimited countries",
      "24/7 dedicated support",
      "White-label solution",
      "Advanced analytics",
      "Custom integrations",
      "SLA guarantee",
    ],
    popular: false,
  },
];

const testimonials = [
  {
    name: "Pastor John Smith",
    organization: "Grace Community Church",
    content:
      "ChurchTranspo has revolutionized how we handle transportation. Our volunteer drivers love the simplicity, and our members appreciate the reliable service.",
    rating: 5,
  },
  {
    name: "Sarah Johnson",
    organization: "Hope Center",
    content:
      "The route optimization feature alone has saved us 30% in fuel costs. The platform pays for itself.",
    rating: 5,
  },
  {
    name: "Michael Brown",
    organization: "Faith Baptist Church",
    content:
      "Setting up our transportation service was seamless. The onboarding team guided us every step of the way.",
    rating: 5,
  },
];

const LandingPage = () => {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-6 p-px animate-border-spin bg-conic/[from_var(--border-angle)] from-blue-600 via-purple-600 to-black from-80% via-90% to-100%"
            >
              {/* <span className="wrapper mb-6"> */}
              <span className="p-2 bg-secondary rounded-md">
                🚀 Now supporting multi-country operations
              </span>
              {/* </span> */}
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-300 mb-6">
              Transportation Management
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Made Simple
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-200 mb-8 max-w-3xl mx-auto">
              The complete platform for churches and organizations to manage
              their transportation services. Smart routing, real-time tracking,
              and seamless communication - all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Schedule Demo
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              ✨ 14-day free trial • No credit card required • Setup in minutes
            </p>
          </div>

          {/* Hero Image/Video Placeholder */}
          <div className="mt-16">
            <div className="relative mx-auto max-w-5xl">
              <div className="rounded-2xl shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-1">
                <div className="rounded-xl bg-white h-64 md:h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600">Platform Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to manage transportation
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-200">
              Powerful features designed specifically for faith-based and
              nonprofit organizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div className="size-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-200">
              Choose the perfect plan for your organization&apos;s size and
              needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-dramatic">
            {plans.map((plan, index) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative border-2 transition-all duration-300 ease-out transform-3d hover:scale-[1.03]",
                  plan.popular
                    ? "border-blue-500 shadow-xl scale-105"
                    : hoveredPlan === plan.name
                      ? "border-blue-300 shadow-lg"
                      : "border-gray-200",
                  index === 0 && "rotate-y-2",
                  index === 2 && "-rotate-y-2"
                )}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span>/month</span>
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="h-full flex flex-col justify-between">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/register" className="block mt-8">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white dark:bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by organizations worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-200">
              See what our customers are saying about ChurchTranspo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border shadow-lg">
                <CardContent className="pt-6 flex flex-col justify-between h-full">
                  <div className="flex-[80%]">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    <p className="mb-6 italic">
                      &quot;{testimonial.content}&quot;
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {testimonial.organization}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your transportation service?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of organizations already using ChurchTranspo to serve
            their communities better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:font-bold"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
