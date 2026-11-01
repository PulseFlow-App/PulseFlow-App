/**
 * Sign-in is stored in a cookie. A cookie without a domain stays on the
 * address that set it, so app.pulseflow.site and services.pulseflow.site
 * would each need their own sign-in. Domain `.pulseflow.site` sends the
 * same note to both. Localhost is left alone; that domain would be rejected.
 */
export function authCookieDomain(hostHeader: string | null | undefined) {
  const name = (hostHeader ?? "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
  if (name === "pulseflow.site" || name.endsWith(".pulseflow.site")) {
    return ".pulseflow.site";
  }
  return undefined;
}
