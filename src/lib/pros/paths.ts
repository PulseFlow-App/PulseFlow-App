import { LOCALES, type Locale } from "@/lib/i18n/types";

/** Public site. Pages are served from services.pulseflow.site. */
export const MARKETPLACE_ORIGIN = "https://services.pulseflow.site";
/** Property ops app. Pages are served from app.pulseflow.site. */
export const APP_ORIGIN = "https://app.pulseflow.site";

export function isServicesLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && (LOCALES as readonly string[]).includes(value));
}

export function isMarketplaceHost(host: string) {
  const name = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    name === "services.pulseflow.site" ||
    name.startsWith("services.") ||
    name === "pros.pulseflow.site" ||
    name.startsWith("pros.")
  );
}

function hostParts(hostHeader: string) {
  const host = hostHeader.split(",")[0]?.trim() ?? "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const port = host.includes(":") ? host.slice(hostname.length + 1) : "";
  return { host, hostname, port };
}

function withPort(name: string, port: string) {
  return port ? `${name}:${port}` : name;
}

function schemeOf(protocol: string) {
  return protocol.endsWith(":") ? protocol.slice(0, -1) : protocol;
}

/** Origin for the public site, including the local services.localhost host. */
export function marketplaceOriginForHost(hostHeader: string, protocol = "https:") {
  const { host, hostname, port } = hostParts(hostHeader);
  const scheme = schemeOf(protocol);
  if (isMarketplaceHost(host)) return `${scheme}://${host}`;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${scheme}://${withPort("services.localhost", port)}`;
  }
  if (hostname === "pulseflow.site" || hostname.endsWith(".pulseflow.site")) {
    return MARKETPLACE_ORIGIN;
  }
  return `${scheme}://${withPort(`services.${hostname}`, port)}`;
}

/** Origin for the Pulse Flow app. Localhost keeps the current port. */
export function appOriginForHost(hostHeader: string, protocol = "https:") {
  const { host, hostname, port } = hostParts(hostHeader);
  const scheme = schemeOf(protocol);
  if (isMarketplaceHost(host)) {
    if (
      hostname === "localhost" ||
      hostname === "services.localhost" ||
      hostname.endsWith(".localhost")
    ) {
      return `${scheme}://${withPort("localhost", port)}`;
    }
    return APP_ORIGIN;
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${scheme}://${host}`;
  }
  if (
    hostname === "app.pulseflow.site" ||
    hostname === "pulseflow.site" ||
    hostname.endsWith(".pulseflow.site")
  ) {
    return APP_ORIGIN;
  }
  return `${scheme}://${host}`;
}

/** Browser path on the public site. /pros is the internal rewrite only. */
export function marketplacePath(appPath: string) {
  if (appPath === "/pros") return "/";
  if (appPath.startsWith("/pros/")) return appPath.slice("/pros".length);
  return appPath;
}

/** Keep /pros only when the browser is already on that internal path. */
export function servicesPath(pathname: string, publicPath: string) {
  const [path, query] = publicPath.split("?");
  const clean = path.startsWith("/") ? path : `/${path}`;
  const internal = pathname === "/pros" || pathname.startsWith("/pros/");
  const base = !internal ? clean : clean === "/" ? "/pros" : `/pros${clean}`;
  return query ? `${base}?${query}` : base;
}

/** Only marketplace paths may be used as a post-login return target. */
export function prosReturnPath(raw: string | null | undefined) {
  if (!raw || raw.startsWith("//") || raw.includes("://") || raw.includes("\\")) return null;
  if (raw.startsWith("/pros")) return raw;
  return null;
}
