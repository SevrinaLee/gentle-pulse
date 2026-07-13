// A single pending check-in captured from an anonymous visitor before they had
// an account. Held only in the browser (localStorage) — nothing touches the
// server until they sign up, at which point GuestCheckInMigrator replays it.
export const GUEST_CHECKIN_KEY = "gp_pending_checkin";

export interface PendingCheckIn {
  mood: string;
  raw_text: string;
}
