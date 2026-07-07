-- Enum types dipakai di beberapa tabel
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('teknisi', 'it_site_operations');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE device_condition AS ENUM ('normal', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE checklist_status AS ENUM ('draft', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
