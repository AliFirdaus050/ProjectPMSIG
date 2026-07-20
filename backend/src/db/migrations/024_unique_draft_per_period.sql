CREATE UNIQUE INDEX IF NOT EXISTS pm_checklists_one_draft_per_period
  ON pm_checklists (asset_id, period_key)
  WHERE status = 'draft';