import { RequestStatus } from "@/generated/prisma";
import { utils, write } from "xlsx";
import { prisma } from "./db";

// Report Types
export enum ReportType {
  PICKUP_SUMMARY = "pickup_summary",
  DRIVER_PERFORMANCE = "driver_performance",
  USER_ACTIVITY = "user_activity",
  BILLING_SUMMARY = "billing_summary",
  ROUTE_ANALYTICS = "route_analytics",
  USAGE_STATS = "usage_stats",
}

// Report filters
interface ReportFilters {
  dateFrom: Date;
  dateTo: Date;
  driverId?: string;
  userId?: string;
  status?: RequestStatus;
  serviceType?: string;
}

// Report data structures
interface PickupSummaryData {
  date: string;
  totalRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  completionRate: number;
  averageDistance: number;
}

interface DriverPerformanceData {
  driverId: string;
  driverName: string;
  totalRoutes: number;
  totalPickups: number;
  totalDistance: number;
  averageOptimizationScore: number;
  onTimePercentage: number;
}

interface UserActivityData {
  userId: string;
  userName: string;
  totalRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  averageWaitTime: number;
}

type ExportableRow = {
  [key: string]: string | number | undefined;
};

type DataType = ExportableRow[];

// Generate pickup summary report
export const generatePickupSummaryReport = async (
  organizationId: string,
  filters: ReportFilters
): Promise<PickupSummaryData[]> => {
  const pickupRequests = await prisma.pickupRequest.findMany({
    where: {
      organizationId,
      requestDate: {
        gte: filters.dateFrom,
        lte: filters.dateTo,
      },
      ...(filters.status && { status: filters.status }),
      ...(filters.driverId && { driverId: filters.driverId }),
    },
    include: {
      serviceDay: true,
    },
  });

  // Group by date
  const groupedByDate = pickupRequests.reduce(
    (acc, request) => {
      const date = request.requestDate.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(request);
      return acc;
    },
    {} as Record<string, typeof pickupRequests>
  );

  return Object.entries(groupedByDate)
    .map(([date, requests]) => {
      const totalRequests = requests.length;
      const completedRequests = requests.filter(
        (r) => r.status === "COMPLETED"
      ).length;
      const cancelledRequests = requests.filter(
        (r) => r.status === "CANCELLED"
      ).length;
      const completionRate =
        totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;
      const averageDistance =
        requests.length > 0
          ? requests.reduce((sum, r) => sum + (r.distance || 0), 0) /
            requests.length
          : 0;

      return {
        date,
        totalRequests,
        completedRequests,
        cancelledRequests,
        completionRate: Math.round(completionRate * 100) / 100,
        averageDistance: Math.round(averageDistance * 100) / 100,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Generate driver performance report
export const generateDriverPerformanceReport = async (
  organizationId: string,
  filters: ReportFilters
): Promise<DriverPerformanceData[]> => {
  const routes = await prisma.route.findMany({
    where: {
      organizationId,
      routeDate: {
        gte: filters.dateFrom,
        lte: filters.dateTo,
      },
      ...(filters.driverId && { driverId: filters.driverId }),
    },
    include: {
      driver: true,
      pickupRequests: true,
    },
  });

  // Group by driver
  const groupedByDriver = routes.reduce(
    (acc, route) => {
      const driverId = route.driverId;
      if (!acc[driverId]) {
        acc[driverId] = [];
      }
      acc[driverId].push(route);
      return acc;
    },
    {} as Record<string, typeof routes>
  );

  return Object.entries(groupedByDriver).map(([driverId, driverRoutes]) => {
    const driver = driverRoutes[0].driver;
    const totalRoutes = driverRoutes.length;
    const totalPickups = driverRoutes.reduce(
      (sum, r) => sum + r.pickupRequests.length,
      0
    );
    const totalDistance = driverRoutes.reduce(
      (sum, r) => sum + r.totalDistance,
      0
    );
    const averageOptimizationScore =
      driverRoutes.length > 0
        ? driverRoutes.reduce((sum, r) => sum + (r.optimizationScore || 0), 0) /
          driverRoutes.length
        : 0;

    // Calculate on-time percentage (simplified - assumes route is on time if completed)
    const completedRoutes = driverRoutes.filter(
      (r) => r.status === "COMPLETED"
    ).length;
    const onTimePercentage =
      totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0;

    return {
      driverId,
      driverName: `${driver.firstName} ${driver.lastName}`,
      totalRoutes,
      totalPickups,
      totalDistance: Math.round(totalDistance * 100) / 100,
      averageOptimizationScore:
        Math.round(averageOptimizationScore * 100) / 100,
      onTimePercentage: Math.round(onTimePercentage * 100) / 100,
    };
  });
};

// Generate user activity report
export const generateUserActivityReport = async (
  organizationId: string,
  filters: ReportFilters
): Promise<UserActivityData[]> => {
  const pickupRequests = await prisma.pickupRequest.findMany({
    where: {
      organizationId,
      requestDate: {
        gte: filters.dateFrom,
        lte: filters.dateTo,
      },
      ...(filters.userId && { userId: filters.userId }),
    },
    include: {
      user: true,
    },
  });

  // Group by user
  const groupedByUser = pickupRequests.reduce(
    (acc, request) => {
      const userId = request.userId;
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(request);
      return acc;
    },
    {} as Record<string, typeof pickupRequests>
  );

  return Object.entries(groupedByUser).map(([userId, userRequests]) => {
    const user = userRequests[0].user;
    const totalRequests = userRequests.length;
    const completedRequests = userRequests.filter(
      (r) => r.status === "COMPLETED"
    ).length;
    const cancelledRequests = userRequests.filter(
      (r) => r.status === "CANCELLED"
    ).length;

    // Calculate average wait time (simplified)
    const averageWaitTime =
      userRequests.length > 0
        ? userRequests.reduce((sum, r) => sum + (r.estimatedTime || 0), 0) /
          userRequests.length
        : 0;

    return {
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      totalRequests,
      completedRequests,
      cancelledRequests,
      averageWaitTime: Math.round(averageWaitTime * 100) / 100,
    };
  });
};

// Export to CSV
export const exportToCSV = (data: DataType): string => {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  const headers = Object.keys(data[0]);
  const csvData = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape commas and quotes
          return typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  return csvData;
};

// Export to Excel
export const exportToExcel = (data: DataType): Buffer => {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Report");

  // Auto-size columns
  const colWidths = Object.keys(data[0]).map((key) => ({
    wch: Math.max(key.length, ...data.map((row) => String(row[key]).length)),
  }));
  worksheet["!cols"] = colWidths;

  return write(workbook, { type: "buffer", bookType: "xlsx" });
};

// Export to PDF
export const exportToPDF = async (
  data: DataType,
  title: string
): Promise<Buffer> => {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  try {
    //  import jsPDF
    const { jsPDF } = await import("jspdf");

    // Import autoTable
    const autoTableModule = await import("jspdf-autotable");

    const autoTable = autoTableModule.default;

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 22);

    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

    // Create table
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => String(row[header]))
    );

    // (doc as any).
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] }, // Blue header
      styles: { fontSize: 8 },
      margin: { top: 40 },
    });

    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error("Export PDF report failed");
    throw error;
  }
};

// Create report record
export const createReport = async (
  organizationId: string,
  creatorId: string,
  name: string,
  type: ReportType,
  filters: ReportFilters,
  format: "csv" | "excel" | "pdf" = "pdf"
): Promise<string> => {
  const report = await prisma.report.create({
    data: {
      organizationId,
      creatorId,
      name,
      type,
      filters: JSON.stringify(filters),
      dateRange: JSON.stringify({
        start: filters.dateFrom.toISOString(),
        end: filters.dateTo.toISOString(),
      }),
      format,
      status: "generating",
    },
  });

  // Generate report data in background (simplified - in real app, use queue)
  try {
    let data: DataType = [];
    let title = name;

    switch (type) {
      case ReportType.PICKUP_SUMMARY:
        const pickupData = await generatePickupSummaryReport(
          organizationId,
          filters
        );
        data = pickupData.map((row) => ({
          date: row.date,
          totalRequests: row.totalRequests,
          completedRequests: row.completedRequests,
          cancelledRequests: row.cancelledRequests,
          completionRate: row.completionRate,
          averageDistance: row.averageDistance,
        }));
        title = "Pickup Summary Report";
        break;
      case ReportType.DRIVER_PERFORMANCE:
        const driverData = await generateDriverPerformanceReport(
          organizationId,
          filters
        );
        data = driverData.map((row) => ({
          driverId: row.driverId,
          driverName: row.driverName,
          totalRoutes: row.totalRoutes,
          totalPickups: row.totalPickups,
          totalDistance: row.totalDistance,
          averageOptimizationScore: row.averageOptimizationScore,
          onTimePercentage: row.onTimePercentage,
        }));
        title = "Driver Performance Report";
        break;
      case ReportType.USER_ACTIVITY:
        const userData = await generateUserActivityReport(
          organizationId,
          filters
        );
        data = userData.map((row) => ({
          userId: row.userId,
          userName: row.userName,
          totalRequests: row.totalRequests,
          completedRequests: row.completedRequests,
          cancelledRequests: row.cancelledRequests,
          averageWaitTime: row.averageWaitTime,
        }));
        title = "User Activity Report";
        break;
      default:
        throw new Error(`Report type ${type} not implemented`);
    }

    let fileBuffer: Buffer | string;
    let fileSize: number;

    switch (format) {
      case "csv":
        fileBuffer = exportToCSV(data);
        fileSize = Buffer.byteLength(fileBuffer, "utf8");
        break;
      case "excel":
        fileBuffer = exportToExcel(data);
        fileSize = fileBuffer.length;
        break;
      case "pdf":
        fileBuffer = await exportToPDF(data, title);
        fileSize = fileBuffer.length;
        break;
    }

    // In real app, upload to S3/cloud storage
    const fileUrl = `/reports/${report.id}.${format}`;

    // Update report with results
    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "ready",
        fileUrl,
        fileSize,
        recordCount: data.length,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  } catch (error) {
    // Update report with error status
    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "failed",
      },
    });
    throw error;
  }

  return report.id;
};

// Get user reports
export const getUserReports = async (
  organizationId: string,
  creatorId?: string
) => {
  const where: Record<string, string> = { organizationId };
  if (creatorId) {
    where.creatorId = creatorId;
  }

  return await prisma.report.findMany({
    where,
    include: {
      creator: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
