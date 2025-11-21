import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

// Example tenant lookup function
const getTenantBySlug = async (slug: string) => {
  if (slug === "tenanta") return { id: 1, slug, name: "Tenant A" };
  return null;
};

// Example tenant lookup function
const getTenantByCustomDomain = async (domain: string) => {
  if (domain === "acme.com")
    return { id: 1, slug: "tenanta", name: "Tenant A" };
  return null;
};

export const testProxy = async (req: NextRequest) => {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  console.log("Incoming request pathname:", pathname);
  console.log("Incoming host:", host);

  let tenant: Record<string, string | number> | null = null;

  // Detect route type
  if (host.startsWith("admin.")) {
    // Platform admin
    console.log("Admin route detected");
  } else if (host.endsWith("yodify.com")) {
    // Subdomain tenant
    const slug = host.split(".")[0];
    tenant = await getTenantBySlug(slug);
  } else {
    // Custom domain
    tenant = await getTenantByCustomDomain(host);
  }

  // Handle unknown tenants
  if (!tenant && !host.startsWith("admin.") && !host.endsWith("yodify.com")) {
    console.log("Tenant not found for host:", host);
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  // Attach tenant info to request
  req.tenant = tenant;
  console.log("Tenant context attached:", tenant);

  // Get session from auth
  const session = await auth();
  console.log("Session info:", session);

  // Redirect unauthenticated users trying to access tenant routes
  if (tenant && !session) {
    console.log(
      "Unauthenticated access to tenant route. Redirecting to login..."
    );
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Rewrite to correct route group
  const url = req.nextUrl.clone();

  if (host.startsWith("admin.")) {
    url.pathname = `/platform${pathname}`;
  } else if (tenant) {
    url.pathname = `/tenant${pathname}`;
  } else {
    url.pathname = `/marketing${pathname}`;
  }

  console.log("Rewriting URL to:", url.pathname);

  return NextResponse.rewrite(url);
};

export const config = {
  matcher: ["/"],
};
