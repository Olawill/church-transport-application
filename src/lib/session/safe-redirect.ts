export const safeRedirect = (
  path: string | null,
  fallback: string = "/dashboard",
) => {
  if (!path) return fallback;

  // Must be a relative path
  if (!path.startsWith("/")) return fallback;

  // Prevent protocol-reltive URLs (//evil.com)
  if (path.startsWith("//")) return fallback;

  // Prevent redirect loop
  if (path === "/login") return fallback;

  return path;
};
