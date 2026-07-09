ALTER TYPE user_role RENAME VALUE 'it_site_operations' TO 'spv';

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pic';