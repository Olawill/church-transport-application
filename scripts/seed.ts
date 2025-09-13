import { ServiceType, UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting database seed...");

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@church.com" },
    update: {},
    create: {
      email: "admin@church.com",
      firstName: "Church",
      lastName: "Administrator",
      password: adminPassword,
      role: UserRole.ADMIN,
      status: "APPROVED",
      phone: "416-555-0100",
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // Create default admin address
  await prisma.address.upsert({
    where: { id: "admin-address" },
    update: {},
    create: {
      id: "admin-address",
      userId: admin.id,
      name: "Home",
      street: "716 Macleod Trail SE",
      city: "Calgary",
      province: "AB",
      postalCode: "T2G 5E6",
      country: "Canada",
      latitude: 51.046051,
      longitude: -114.057385,
      isDefault: true,
    },
  });

  // Create default service days
  const serviceDays = [
    {
      name: "Sunday Morning Service",
      dayOfWeek: 0, // Sunday
      time: "11:00",
      serviceType: ServiceType.REGULAR,
    },
    {
      name: "Thursday Evening Service",
      dayOfWeek: 4, // Thursday
      time: "19:00",
      serviceType: ServiceType.REGULAR,
    },
  ];

  for (const serviceDay of serviceDays) {
    await prisma.serviceDay.upsert({
      where: { id: `${serviceDay.dayOfWeek}-${serviceDay.time}` },
      update: {},
      create: {
        id: `${serviceDay.dayOfWeek}-${serviceDay.time}`,
        ...serviceDay,
      },
    });
  }

  console.log("✅ Default service days created");

  // Create sample transportation team member
  const driverPassword = await bcrypt.hash("driver123", 10);
  const driver = await prisma.user.upsert({
    where: { email: "driver@church.com" },
    update: {},
    create: {
      email: "driver@church.com",
      firstName: "John",
      lastName: "Driver",
      password: driverPassword,
      role: UserRole.TRANSPORTATION_TEAM,
      status: "APPROVED",
      phone: "416-555-0200",
      maxDistance: 20,
    },
  });

  console.log("✅ Sample driver created:", driver.email);

  // Create driver address
  await prisma.address.create({
    data: {
      userId: driver.id,
      name: "Home",
      street: "2500 University Dr NW",
      city: "Calgary",
      province: "AB",
      postalCode: "T2N 1N4",
      country: "Canada",
      latitude: 51.078621,
      longitude: -114.136719,
      isDefault: true,
    },
  });

  // Create sample regular user
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@church.com" },
    update: {},
    create: {
      email: "user@church.com",
      firstName: "Jane",
      lastName: "Member",
      password: userPassword,
      role: UserRole.USER,
      status: "APPROVED",
      phone: "416-555-0300",
    },
  });

  console.log("✅ Sample user created:", user.email);

  // Create user address
  await prisma.address.create({
    data: {
      userId: user.id,
      name: "Home",
      street: "800 3 St SE",
      city: "Calgary",
      province: "AB",
      postalCode: "T2G 2E7",
      country: "Canada",
      latitude: 51.046494,
      longitude: -114.057732,
      isDefault: true,
    },
  });

  // Create system configuration entries
  const systemConfigs = [
    { key: "church_name", value: "The Citadel International Church" },
    { key: "church_address", value: "7915 8 Street NE, Calgary, AB T2E 8A2" },
    { key: "church_phone", value: "+1 800-257-0658" },
    { key: "max_request_hours_before", value: "2" },
    { key: "min_request_minutes_before", value: "30" },
    { key: "default_max_distance", value: "10" },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log("✅ System configuration created");
  console.log("🌱 Database seed completed!");
  console.log("\n📋 Default Accounts:");
  console.log("Admin: admin@church.com / admin123");
  console.log("Driver: driver@church.com / driver123");
  console.log("User: user@church.com / user123");
}

main()
  .catch((e) => {
    console.error("🚫 Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
