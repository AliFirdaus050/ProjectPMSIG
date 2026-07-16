-- tabel assets

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name VARCHAR(150) NOT NULL, -- device
  asset_tag VARCHAR(100) NOT NULL, -- id tag aset
  serial_number VARCHAR(100) NOT NULL, --serial number bukan unique 
  model VARCHAR(150) NOT NULL, --merk dan tipenya
  category VARCHAR(100) NOT NULL, -- pc/desktop, printer, switch
  hostname VARCHAR(150), -- bisa null
  site VARCHAR(100) NOT NULL, -- tuban semua wkwk
  detail_location VARCHAR(255), -- ini lokasi lebih lengkap
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id)
);
