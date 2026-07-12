-- Tabel log aktivitas: jejak audit semua aksi penting di sistem, bisa diakses admin.
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(60) NOT NULL,           -- misal 'auth.login', 'checklist.approve'
  entity_type VARCHAR(40),               -- 'checklist', 'asset', 'schedule', 'user', 'signature'
  entity_id UUID,                        -- polymorphic, tanpa FK constraint (bisa merujuk ke tabel manapun)
  description TEXT,                      -- ringkasan yang enak dibaca manusia
  metadata JSONB,                        -- data tambahan terstruktur (opsional)
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);