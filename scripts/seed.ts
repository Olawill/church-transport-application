import { Prisma, ServiceType, UserRole } from "@/generated/prisma";
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
    { key: "churchName", value: "The Citadel International Church" },
    { key: "churchAcronym", value: "TCIC" },
    { key: "branchName", value: "TCIC Calgary" },
    { key: "churchAddress", value: "7915 8 Street NE" },
    { key: "churchCity", value: "Calgary" },
    { key: "churchProvince", value: "AB" },
    { key: "churchPostalCode", value: "T2E 8A2" },
    { key: "churchCountry", value: "Canada" },
    { key: "churchPhone", value: "+18002570658" },
    { key: "requestCutOffInHrs", value: "2" },
    { key: "defaultMaxDistance", value: "10" },
  ];

  // for (const config of systemConfigs) {
  // await prisma.systemConfig.upsert({
  //   where: { key: config.key },
  //   update: { value: config.value },
  //   create: config,
  // });
  // }
  const configData: Prisma.SystemConfigCreateInput = {
    churchName: systemConfigs.find((c) => c.key === "churchName")?.value || "",
    churchAcronym:
      systemConfigs.find((c) => c.key === "churchAcronym")?.value || null,
  };

  const system = await prisma.systemConfig.upsert({
    where: { churchAcronym: configData.churchAcronym ?? "DEFAULT" },
    update: configData,
    create: configData,
    select: { id: true },
  });

  const branchData: Prisma.SystemBranchInfoCreateManyInput = {
    branchName: systemConfigs.find((c) => c.key === "branchName")?.value || "",
    systemConfigId: system.id,
    churchAddress:
      systemConfigs.find((c) => c.key === "churchAddress")?.value || "",
    churchCity: systemConfigs.find((c) => c.key === "churchCity")?.value || "",
    churchProvince:
      systemConfigs.find((c) => c.key === "churchProvince")?.value || "",
    churchPostalCode:
      systemConfigs.find((c) => c.key === "churchPostalCode")?.value || "",
    churchCountry:
      systemConfigs.find((c) => c.key === "churchCountry")?.value || "",
    churchPhone:
      systemConfigs.find((c) => c.key === "churchPhone")?.value || "",
    requestCutOffInHrs:
      systemConfigs.find((c) => c.key === "requestCutOffInHrs")?.value ?? "0",
    defaultMaxDistance:
      systemConfigs.find((c) => c.key === "defaultMaxDistance")?.value ?? "0",
  };

  await prisma.systemBranchInfo.create({
    data: branchData,
  });

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
