CREATE TABLE IF NOT EXISTS pm_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  technician_id UUID NOT NULL REFERENCES users(id),
  checklist_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hostname_note VARCHAR(150),
  ip_address VARCHAR(45),   -- mendukung IPv4/IPv6
  mac_address VARCHAR(50),
  pdf_path VARCHAR(500),    -- nullable sampai PDF pertama kali digenerate
  status checklist_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
