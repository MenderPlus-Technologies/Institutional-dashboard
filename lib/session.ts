const SESSION_KEY = "indura_session";
const INSTITUTION_ID_KEY = "indura_institution_id";
const USER_ID_KEY = "indura_user_id";
const TOKEN_KEY = "indura_token";
const NEEDS_PIN_KEY = "indura_needs_pin";

export function setLoggedIn(institutionId?: string, token?: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, "true");
  if (institutionId) {
    sessionStorage.setItem(INSTITUTION_ID_KEY, institutionId);
  } else {
    sessionStorage.removeItem(INSTITUTION_ID_KEY);
  }
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function setInstitutionId(institutionId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INSTITUTION_ID_KEY, institutionId);
}

export function getInstitutionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = sessionStorage.getItem(INSTITUTION_ID_KEY);
  return value && value.trim() ? value : undefined;
}

export function setUserId(userId?: string) {
  if (typeof window === "undefined") return;
  if (userId && userId.trim()) {
    sessionStorage.setItem(USER_ID_KEY, userId.trim());
    return;
  }
  sessionStorage.removeItem(USER_ID_KEY);
}

export function getUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = sessionStorage.getItem(USER_ID_KEY);
  return value && value.trim() ? value : undefined;
}

export function getAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = sessionStorage.getItem(TOKEN_KEY);
  return value && value.trim() ? value : undefined;
}

export function setNeedsTransactionPin(needed: boolean) {
  if (typeof window === "undefined") return;
  if (needed) {
    sessionStorage.setItem(NEEDS_PIN_KEY, "true");
    return;
  }
  sessionStorage.removeItem(NEEDS_PIN_KEY);
}

export function needsTransactionPin() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(NEEDS_PIN_KEY) === "true";
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(INSTITUTION_ID_KEY);
  sessionStorage.removeItem(USER_ID_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(NEEDS_PIN_KEY);
}

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "true";
}
