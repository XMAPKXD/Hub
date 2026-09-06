import { CookieCategoriesConsent, CookieCategory, CookieConsentRecord } from '../types/privacy';

export const COOKIE_CONSENT_STORAGE_KEY = 'pkxd_cookie_consent_v1';
export const CURRENT_POLICY_VERSION = 'v1.0';

export const DEFAULT_COOKIE_CONSENT: CookieCategoriesConsent = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

/**
 * Retrieve current cookie consent record from storage.
 * Returns null if the user has never made an explicit choice.
 */
export function getStoredCookieConsent(): CookieConsentRecord | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.hasConsented === 'boolean') {
      return {
        hasConsented: parsed.hasConsented,
        categories: {
          necessary: true, // Always locked to true
          preferences: Boolean(parsed.categories?.preferences),
          analytics: Boolean(parsed.categories?.analytics),
          marketing: Boolean(parsed.categories?.marketing),
        },
        timestamp: parsed.timestamp || new Date().toISOString(),
        policyVersion: parsed.policyVersion || CURRENT_POLICY_VERSION,
      };
    }
  } catch (e) {
    console.warn('Erro ao ler consentimento de cookies:', e);
  }
  return null;
}

/**
 * Save user cookie preferences
 */
export function saveCookieConsent(
  preferences: Partial<CookieCategoriesConsent>,
  hasConsented: boolean = true
): CookieConsentRecord {
  const record: CookieConsentRecord = {
    hasConsented,
    categories: {
      necessary: true, // Always true
      preferences: preferences.preferences ?? false,
      analytics: preferences.analytics ?? false,
      marketing: preferences.marketing ?? false,
    },
    timestamp: new Date().toISOString(),
    policyVersion: CURRENT_POLICY_VERSION,
  };

  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch (e) {
    console.warn('Erro ao salvar consentimento de cookies no localStorage:', e);
  }

  // Notify listeners across the application
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pkxd_cookie_consent_changed', { detail: record })
    );
  }

  return record;
}

/**
 * Convenience helper to accept all categories
 */
export function acceptAllCookies(): CookieConsentRecord {
  return saveCookieConsent({
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
  }, true);
}

/**
 * Convenience helper to reject non-essential cookies
 */
export function rejectNonEssentialCookies(): CookieConsentRecord {
  return saveCookieConsent({
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  }, true);
}

/**
 * Check if a specific cookie category is allowed.
 * Necessary is always allowed.
 */
export function isCookieCategoryAllowed(category: CookieCategory): boolean {
  if (category === 'necessary') return true;
  const consent = getStoredCookieConsent();
  if (!consent || !consent.hasConsented) return false;
  return Boolean(consent.categories[category]);
}

/**
 * Reset cookie consent choice (forces banner to re-appear)
 */
export function resetCookieConsent(): void {
  try {
    localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pkxd_cookie_consent_changed', { detail: null })
      );
    }
  } catch (e) {
    console.warn('Erro ao resetar cookies:', e);
  }
}
