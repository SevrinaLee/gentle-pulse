-- Founder accounts: full access to all features, never gated behind future
-- billing/paywalls. No feature in the app currently checks this flag — there
-- is no billing/paywall yet (see docs/BUILD_LOG.md Stage 6 and the Billing
-- placeholder on /account) — this only marks the account so that whenever
-- paywall logic is built, it has a ready-made bypass to check.

alter table profiles add column if not exists is_founder boolean not null default false;

-- death_draconite@hotmail.com — flagged by the account owner as their own
-- founder account.
update profiles set is_founder = true
where id = '3b146c9c-3707-4d4b-bfd7-2c14ab14abb9';
