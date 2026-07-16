-- pembuatan checklist software tambahan

CREATE TABLE IF NOT EXISTS checklist_additional_software (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES pm_checklists(id) ON DELETE CASCADE,
  software_name VARCHAR(150) NOT NULL
);
