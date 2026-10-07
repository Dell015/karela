/**
 * Telling "the network blinked" apart from real errors.
 *
 * On a phone, requests are cut off all the time: switching between Wi-Fi
 * and data, the app going to the background, a reload in development.
 * Expo reports these as e.g. "fetch failed: UnexpectedException: cancelled".
 * They are expected (the app is offline-first), so they should not be logged
 * with console.error, which pops up a red error box in development.
 */
const TRANSIENT = [
  "cancelled",
  "canceled",
  "network request failed",
  "fetch failed",
  "the internet connection appears to be offline",
  "timed out",
  "network connection was lost",
  "aborted",
];

export const isTransientNetworkError = (err: unknown): boolean => {
  if (!err) return false;
  const e = err as { message?: string; details?: string };
  const text = `${e.message ?? ""} ${e.details ?? ""} ${typeof err === "string" ? err : ""}`.toLowerCase();
  return TRANSIENT.some((t) => text.includes(t));
};

/** Logs a failed request: a quiet warning if the network blinked, an error otherwise. */
export const logRequestError = (what: string, err: unknown) => {
  if (isTransientNetworkError(err)) {
    console.warn(`${what} (offline or interrupted, will retry later)`);
  } else {
    console.error(what, err);
  }
};
