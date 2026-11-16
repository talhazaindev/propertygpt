/** Shared display helpers for listings. */

export function formatPrice(price: number, listingType?: string): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(price) ? price : 0);
  return listingType === "RENTAL" ? `${formatted}/mo` : formatted;
}

export function formatArea(area: number | null | undefined): string {
  if (area == null || !Number.isFinite(area)) return "—";
  return `${area.toLocaleString("en-PK")} sq ft`;
}

/** Digits-only phone for tel:/wa.me links. */
export function normalizePhoneDigits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Pakistan local 03XXXXXXXXX → 923XXXXXXXXX for WhatsApp
  if (digits.startsWith("03") && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  if (digits.startsWith("9203")) {
    return `92${digits.slice(2)}`;
  }
  return digits;
}

export function whatsappUrl(phone: string | null | undefined, message?: string): string | null {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function telUrl(phone: string | null | undefined): string | null {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;
  return `tel:+${digits}`;
}
