CREATE TABLE IF NOT EXISTS checklist_software_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES pm_checklists(id) ON DELETE CASCADE,
  software_name VARCHAR(150) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT false
);
