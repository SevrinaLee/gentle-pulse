-- Sprint 6 — tag corrections (no-key half)
-- When a user re-categorizes a miscategorized check-in, the corrected value
-- overwrites friction_tags.category (so pattern aggregation, which reads that
-- column, reflects the truth). To keep the AI's original guess as training
-- signal — what the model said vs. what the human corrected it to — we stash
-- it here the first time a correction happens.
--
-- category_review_status is free text (no CHECK constraint), so the app can
-- write the value 'corrected' without a schema change.

alter table friction_tags
  add column if not exists original_category text;
