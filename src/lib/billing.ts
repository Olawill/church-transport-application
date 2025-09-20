import {
  BillingInterval,
  BillingPlan,
  Prisma,
  SubscriptionStatus,
} from "@/generated/prisma";
import { prisma } from "./db";

// Billing plans configuration
export const billingPlans = {
  STARTER: {
    name: "Starter",
    basePrice: 29,
    features: [
      "Up to 50 users",
      "Up to 3 drivers",
      "500 monthly requests",
      "Basic notifications",
      "Email support",
    ],
    limits: {
      maxUsers: 50,
      maxDrivers: 3,
      maxMonthlyRequests: 500,
      enableRouteOptimization: false,
      enableAdvancedReports: false,
    },
  },
  PROFESSIONAL: {
    name: "Professional",
    basePrice: 79,
    features: [
      "Up to 200 users",
      "Up to 10 drivers",
      "2000 monthly requests",
      "All notification channels",
      "Route optimization",
      "Basic reports",
      "Priority support",
    ],
    limits: {
      maxUsers: 200,
      maxDrivers: 10,
      maxMonthlyRequests: 2000,
      enableRouteOptimization: true,
      enableAdvancedReports: false,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    basePrice: 199,
    features: [
      "Unlimited users",
      "Unlimited drivers",
      "Unlimited requests",
      "All features included",
      "Advanced analytics & reports",
      "Custom integrations",
      "24/7 phone support",
    ],
    limits: {
      maxUsers: -1, // Unlimited
      maxDrivers: -1,
      maxMonthlyRequests: -1,
      enableRouteOptimization: true,
      enableAdvancedReports: true,
    },
  },
  CUSTOM: {
    name: "Custom",
    basePrice: 0, // Set individually
    features: [
      "Tailored to your needs",
      "Custom feature set",
      "Dedicated support",
      "Custom integrations",
    ],
    limits: {
      maxUsers: -1,
      maxDrivers: -1,
      maxMonthlyRequests: -1,
      enableRouteOptimization: true,
      enableAdvancedReports: true,
    },
  },
};

// Country-based pricing multipliers
export const countryMultipliers = {
  CA: 1.0, // Canada - base
  US: 1.2, // United States - 20% more
  GB: 1.1, // United Kingdom - 10% more
  AU: 1.15, // Australia - 15% more
  NZ: 1.15, // New Zealand - 15% more
  IN: 0.4, // India - 60% less
  NG: 0.3, // Nigeria - 70% less
  KE: 0.35, // Kenya - 65% less
  GH: 0.3, // Ghana - 70% less
  ZA: 0.5, // South Africa - 50% less
  PH: 0.4, // Philippines - 60% less
  SG: 1.0, // Singapore - same as base
  MY: 0.6, // Malaysia - 40% less
  HK: 1.0, // Hong Kong - same as base
};

type CountryCode = keyof typeof countryMultipliers;

type SubscriptionType = keyof typeof billingPlans;

type LimitType = (typeof billingPlans)[SubscriptionType]["limits"];

// Calculate subscription pricing
export const calculateSubscriptionPricing = (
  plan: BillingPlan,
  countries: string[],
  interval: BillingInterval = BillingInterval.MONTHLY
): {
  basePrice: number;
  countryMultiplier: number;
  totalMonthlyPrice: number;
  intervalPrice: number;
  intervalDiscount: number;
} => {
  const planConfig = billingPlans[plan];
  const basePrice = planConfig.basePrice;

  // Calculate country multiplier (average of all selected countries)
  const countryMultiplier =
    countries.length > 0
      ? countries.reduce(
          (sum, country) =>
            sum + (countryMultipliers[country as CountryCode] || 1.0),
          0
        ) / countries.length
      : 1.0;

  const totalMonthlyPrice = basePrice * countryMultiplier;

  // Apply interval discounts
  let intervalPrice = totalMonthlyPrice;
  let intervalDiscount = 0;

  switch (interval) {
    case BillingInterval.QUARTERLY:
      intervalDiscount = 0.1; // 10% discount
      intervalPrice = totalMonthlyPrice * 3 * (1 - intervalDiscount);
      break;
    case BillingInterval.YEARLY:
      intervalDiscount = 0.2; // 20% discount
      intervalPrice = totalMonthlyPrice * 12 * (1 - intervalDiscount);
      break;
    default:
      intervalPrice = totalMonthlyPrice;
      break;
  }

  return {
    basePrice,
    countryMultiplier,
    totalMonthlyPrice,
    intervalPrice,
    intervalDiscount,
  };
};

// Subscription management
export const createSubscription = async (
  organizationId: string,
  plan: BillingPlan,
  countries: string[]
) => {
  const pricing = calculateSubscriptionPricing(plan, countries);

  return await prisma.subscription.create({
    data: {
      organizationId,
      plan,
      status: SubscriptionStatus.TRIAL,
      basePrice: pricing.basePrice,
      countryMultiplier: pricing.countryMultiplier,
      totalPrice: pricing.totalMonthlyPrice,
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });
};

export const upgradeSubscription = async (
  organizationId: string,
  newPlan: BillingPlan,
  countries: string[]
) => {
  const pricing = calculateSubscriptionPricing(newPlan, countries);

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  return await prisma.subscription.update({
    where: { organizationId },
    data: {
      plan: newPlan,
      basePrice: pricing.basePrice,
      countryMultiplier: pricing.countryMultiplier,
      totalPrice: pricing.totalMonthlyPrice,
      status: SubscriptionStatus.ACTIVE,
    },
  });
};

// Usage tracking
export const trackUsage = async (
  organizationId: string,
  metric: string,
  value: number
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Create usage record
  await prisma.usageRecord.create({
    data: {
      organizationId,
      subscriptionId: subscription.id,
      metric,
      value,
    },
  });

  // Update current usage in subscription
  const updateData: Prisma.SubscriptionUpdateInput = {};
  switch (metric) {
    case "users":
      updateData.currentUsers = value;
      break;
    case "drivers":
      updateData.currentDrivers = value;
      break;
    case "monthly_requests":
      updateData.monthlyRequests = value;
      break;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.subscription.update({
      where: { organizationId },
      data: updateData,
    });
  }
};

// Check usage limits
export const checkUsageLimits = async (
  organizationId: string
): Promise<{
  withinLimits: boolean;
  limits: LimitType;
  current: Record<string, number>;
  warnings: string[];
}> => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: true,
      countries: true,
    },
  });

  if (!organization?.subscription) {
    throw new Error("Organization or subscription not found");
  }

  const planConfig = billingPlans[organization.subscription.plan];
  const limits = planConfig.limits;
  const current = {
    users: organization.subscription.currentUsers,
    drivers: organization.subscription.currentDrivers,
    monthlyRequests: organization.subscription.monthlyRequests,
  };

  const warnings: string[] = [];
  let withinLimits = true;

  // Check user limits
  if (limits.maxUsers !== -1 && current.users > limits.maxUsers) {
    warnings.push(`User limit exceeded: ${current.users}/${limits.maxUsers}`);
    withinLimits = false;
  }

  // Check driver limits
  if (limits.maxDrivers !== -1 && current.drivers > limits.maxDrivers) {
    warnings.push(
      `Driver limit exceeded: ${current.drivers}/${limits.maxDrivers}`
    );
    withinLimits = false;
  }

  // Check monthly request limits
  if (
    limits.maxMonthlyRequests !== -1 &&
    current.monthlyRequests > limits.maxMonthlyRequests
  ) {
    warnings.push(
      `Monthly request limit exceeded: ${current.monthlyRequests}/${limits.maxMonthlyRequests}`
    );
    withinLimits = false;
  }

  return {
    withinLimits,
    limits,
    current,
    warnings,
  };
};

// Invoice generation
export const generateInvoice = async (
  organizationId: string
): Promise<string> => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: true,
      countries: true,
    },
  });

  if (!organization?.subscription) {
    throw new Error("Organization or subscription not found");
  }

  const subscription = organization.subscription;
  const now = new Date();
  const invoiceNumber = `INV-${organizationId.slice(-8).toUpperCase()}-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;

  const periodStart = subscription.currentPeriodStart || now;
  const periodEnd =
    subscription.currentPeriodEnd ||
    new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subtotal = Number(subscription.totalPrice);
  const taxRate = 0.13; // 13% HST for Canada, adjust based on country
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      subscriptionId: subscription.id,
      number: invoiceNumber,
      subtotal,
      taxRate,
      taxAmount,
      total,
      periodStart,
      periodEnd,
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
      metadata: JSON.stringify({
        plan: subscription.plan,
        countries: organization.countries.map((c) => c.countryCode),
        lineItems: [
          {
            description: `${billingPlans[subscription.plan].name} Plan`,
            quantity: 1,
            unitPrice: subscription.basePrice,
            amount: subscription.totalPrice,
          },
        ],
      }),
    },
  });

  return invoice.id;
};
