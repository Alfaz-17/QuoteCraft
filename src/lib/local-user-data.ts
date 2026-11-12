const OWNER_KEY = "qc:localDataOwner";

export const USER_LOCAL_KEYS = [
  "quoteDraft",
  "companyProfile",
  "brandingProfile",
  "defaultTerms",
  "companyLogo",
  "quotationPreferences",
  "onboardingCompleted",
  "lastDocNumber",
  "userCurrency",
];

/**
 * Binds browser-cached workspace data to a single Clerk user.
 * If a different user signs in on the same browser, the previous user's
 * cached company profile, logo and drafts are wiped.
 * Returns true when data from another user was cleared.
 */
export function ensureLocalDataOwner(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner === userId) return false;
    // Legacy data without an owner is adopted by the first user who signs in.
    if (owner !== null) {
      for (const key of USER_LOCAL_KEYS) localStorage.removeItem(key);
    }
    localStorage.setItem(OWNER_KEY, userId);
    return owner !== null;
  } catch {
    return false;
  }
}

export function newQuotationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Keeps the local doc-number counter ahead of numbers the server assigned. */
export function syncLocalDocCounter(number: string) {
  if (typeof window === "undefined") return;
  const match = number.match(/(\d+)$/);
  if (!match) return;
  try {
    const current = parseInt(localStorage.getItem("lastDocNumber") || "1000", 10);
    const assigned = parseInt(match[1], 10);
    if (assigned > current) localStorage.setItem("lastDocNumber", String(assigned));
  } catch {}
}
