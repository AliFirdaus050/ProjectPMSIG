-- pic asset (15  Juli dibatalkan)

CREATE TABLE IF NOT EXISTS pic_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pic_user_id UUID NOT NULL REFERENCES users(id),
  asset_id UUID NOT NULL REFERENCES assets(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (pic_user_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_pic_assets_pic_user_id ON pic_assets (pic_user_id);
CREATE INDEX IF NOT EXISTS idx_pic_assets_asset_id ON pic_assets (asset_id);