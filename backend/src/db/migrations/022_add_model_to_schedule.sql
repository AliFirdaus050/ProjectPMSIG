const result = await pool.query(
  `SELECT a.id AS asset_id, a.asset_name, a.asset_tag, a.model, a.serial_number, a.detail_location AS site,
          pc.id AS checklist_id, pc.status, pc.checklist_date, pc.spv_approved_at,
          tech.full_name AS technician_name
   FROM pm_schedules ps
   JOIN assets a ON ps.asset_id = a.id
   LEFT JOIN (
     SELECT DISTINCT ON (asset_id, period_key) *
     FROM pm_checklists
     ORDER BY asset_id, period_key, created_at DESC
   ) pc ON pc.asset_id = a.id AND pc.period_key = ps.period_key
   LEFT JOIN users tech ON pc.technician_id = tech.id
   WHERE ${conditions.join(' AND ')}
   ORDER BY a.asset_name, a.asset_tag`,
  values
);