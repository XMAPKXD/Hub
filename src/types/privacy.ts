export type CookieCategory = 'necessary' | 'preferences' | 'analytics' | 'marketing';

export interface CookieCategoriesConsent {
  necessary: boolean; // Always true
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  hasConsented: boolean;
  categories: CookieCategoriesConsent;
  timestamp: string; // ISO 8601
  policyVersion: string;
}

export type DataRequestType = 'access' | 'rectification' | 'deletion' | 'revocation' | 'other';

export interface UserDataRequest {
  id: string;
  protocol: string;
  type: DataRequestType;
  fullName: string;
  email: string;
  details?: string;
  timestamp: string;
  status: 'pending' | 'processed';
}
