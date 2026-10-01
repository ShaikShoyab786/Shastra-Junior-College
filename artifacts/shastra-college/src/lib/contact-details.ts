type CmsRecord = Record<string, unknown>;

export type ContactDetails = {
  address: string;
  email: string;
  mobileNumbers: string[];
  whatsappNumber: string;
  mapEmbedUrl: string;
};

function record(value: unknown): CmsRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CmsRecord)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function readContactDetails(content: unknown): ContactDetails {
  const values = record(content);
  return {
    address: text(values.address),
    email: text(values.email),
    mobileNumbers: Array.isArray(values.mobileNumbers)
      ? values.mobileNumbers.filter(
          (number): number is string => typeof number === "string",
        )
      : [],
    whatsappNumber: text(values.whatsappNumber),
    mapEmbedUrl: text(values.mapEmbedUrl),
  };
}

export function isValidPublicEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isGoogleMapsEmbedUrl(value: string): boolean {
  if (!value.trim()) return false;

  try {
    const url = new URL(value.trim());
    const allowedHost =
      /^(?:www\.|maps\.)?google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)$/i.test(
        url.hostname,
      );
    const isEmbedPath =
      url.pathname.startsWith("/maps/embed") ||
      (url.pathname.startsWith("/maps") &&
        url.searchParams.get("output") === "embed");

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      allowedHost &&
      isEmbedPath
    );
  } catch {
    return false;
  }
}

export function getPhoneHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";
  return value.trim().startsWith("+") ? `tel:+${digits}` : `tel:${digits}`;
}

export function getWhatsAppHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15
    ? `https://wa.me/${digits}`
    : "";
}