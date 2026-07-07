CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets (serial_number);
CREATE INDEX IF NOT EXISTS idx_pm_checklists_asset_id ON pm_checklists (asset_id);
CREATE INDEX IF NOT EXISTS idx_pm_checklists_technician_id ON pm_checklists (technician_id);
CREATE INDEX IF NOT EXISTS idx_pm_checklists_status ON pm_checklists (status);
