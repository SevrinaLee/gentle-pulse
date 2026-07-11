-- Restore the public demo dataset to its intended, presentable state.
--
-- During Sprint 2/3 manual testing, anonymous check-in submissions ran the
-- pattern aggregator against the (then user_id-less) demo rows and overwrote
-- the hand-authored seed occurrence_counts, and one throwaway "troubleshooting"
-- check-in was left behind. After the Sprint 4 lockdown the demo is owned by
-- the demo user and is read-only (writes require auth), so these values are now
-- stable. This migration re-establishes a top pattern (>= 3 occurrences) with
-- an active suggestion so the demo insight card renders again.

-- Remove the stray low-quality test check-in (its friction_tag cascades).
delete from check_ins
  where user_id = '00000000-0000-0000-0000-0000000000de'
    and raw_text = 'troubleshooting';

-- Restore the demo patterns to their seed values.
update patterns set occurrence_count = 6, estimated_hours_per_week = 4.5
  where user_id = '00000000-0000-0000-0000-0000000000de' and category = 'Customer Support';
update patterns set occurrence_count = 5, estimated_hours_per_week = 3.5
  where user_id = '00000000-0000-0000-0000-0000000000de' and category = 'Content Creation';
update patterns set occurrence_count = 3, estimated_hours_per_week = 1.5
  where user_id = '00000000-0000-0000-0000-0000000000de' and category = 'Product Uploads';

-- Drop the stray aggregated category from testing.
delete from patterns
  where user_id = '00000000-0000-0000-0000-0000000000de' and category = 'Uncategorized';

-- Re-activate the demo's headline suggestion (it was toggled to 'ignored'
-- while manually testing the Ignore flow in Sprint 3).
update suggestions set status = 'active'
  where user_id = '00000000-0000-0000-0000-0000000000de'
    and headline = 'Create a Customer Support FAQ reply template';
