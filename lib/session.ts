const SESSION_KEY = "indura_session";

export function setLoggedIn() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, "true");
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "true";
}
