import "next/server";

declare module "next/server" {
  interface NextRequest {
    tenant?: Record<string, string | number> | null;
  }
}
