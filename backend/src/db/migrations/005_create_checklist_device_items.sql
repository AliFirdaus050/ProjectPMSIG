-- tabel checklist item

CREATE TABLE IF NOT EXISTS checklist_device_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES pm_checklists(id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,   -- Monitor/LCD, RAM, SSD, dst
  condition device_condition NOT NULL,
  information TEXT
);
