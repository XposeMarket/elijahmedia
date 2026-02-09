-- ============================================
-- Elijah Media Portfolio Schema
-- This extends the existing Cadence CRM schema
-- ============================================

-- Photography Styles Table
-- Stores different photography styles/portfolios (VHS, Night time, Day time)
CREATE TABLE IF NOT EXISTS photography_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- Gallery Photos Table
-- Stores photos organized by style
CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  style_id UUID NOT NULL REFERENCES photography_styles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photographer Calendar Table
-- Stores availability and off-days
CREATE TABLE IF NOT EXISTS photographer_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_status TEXT NOT NULL DEFAULT 'available' CHECK (day_status IN ('available', 'booked', 'off')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, date)
);

-- Photographer Bookings Table
-- Stores booking requests with approval workflow
CREATE TABLE IF NOT EXISTS photographer_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Client Info
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Booking Details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('personal', 'event')),
  num_people INTEGER DEFAULT 1,
  location TEXT,
  location_type TEXT,
  location_flexible BOOLEAN DEFAULT false,
  special_requests TEXT,
  status TEXT DEFAULT 'inquiry',
  
  -- Approval Workflow
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'denied')),
  approval_token TEXT UNIQUE,
  approval_expires_at TIMESTAMPTZ,
  
  -- Integration
  deal_id TEXT,
  cadence_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  cadence_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photography_styles_org_id ON photography_styles(org_id);
CREATE INDEX IF NOT EXISTS idx_photography_styles_slug ON photography_styles(slug);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_org_id ON gallery_photos(org_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_style_id ON gallery_photos(style_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_featured ON gallery_photos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_photographer_calendar_org_id ON photographer_calendar(org_id);
CREATE INDEX IF NOT EXISTS idx_photographer_calendar_date ON photographer_calendar(date);
CREATE INDEX IF NOT EXISTS idx_photographer_bookings_org_id ON photographer_bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_photographer_bookings_date ON photographer_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_photographer_bookings_status ON photographer_bookings(approval_status);
CREATE INDEX IF NOT EXISTS idx_photographer_bookings_token ON photographer_bookings(approval_token) WHERE approval_token IS NOT NULL;

-- Enable RLS
ALTER TABLE photography_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photography_styles
-- Public can read active styles
CREATE POLICY "Public can view active styles"
  ON photography_styles FOR SELECT
  USING (is_active = true);

-- Org members can manage their styles
CREATE POLICY "Org members can manage styles"
  ON photography_styles FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for gallery_photos
-- Public can read photos from active styles
CREATE POLICY "Public can view gallery photos"
  ON gallery_photos FOR SELECT
  USING (
    style_id IN (
      SELECT id FROM photography_styles WHERE is_active = true
    )
  );

-- Org members can manage their photos
CREATE POLICY "Org members can manage photos"
  ON gallery_photos FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for photographer_calendar
-- Public can read calendar (for availability check)
CREATE POLICY "Public can view calendar"
  ON photographer_calendar FOR SELECT
  USING (true);

-- Org members can manage their calendar
CREATE POLICY "Org members can manage calendar"
  ON photographer_calendar FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for photographer_bookings
-- Public can create bookings
CREATE POLICY "Anyone can create bookings"
  ON photographer_bookings FOR INSERT
  WITH CHECK (true);

-- Public can read their own bookings by token
CREATE POLICY "Public can view bookings by token"
  ON photographer_bookings FOR SELECT
  USING (true);

-- Org members can manage their bookings
CREATE POLICY "Org members can manage bookings"
  ON photographer_bookings FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid()
    )
  );

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_photography_styles_updated_at ON photography_styles;
CREATE TRIGGER update_photography_styles_updated_at
  BEFORE UPDATE ON photography_styles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gallery_photos_updated_at ON gallery_photos;
CREATE TRIGGER update_gallery_photos_updated_at
  BEFORE UPDATE ON gallery_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_photographer_calendar_updated_at ON photographer_calendar;
CREATE TRIGGER update_photographer_calendar_updated_at
  BEFORE UPDATE ON photographer_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_photographer_bookings_updated_at ON photographer_bookings;
CREATE TRIGGER update_photographer_bookings_updated_at
  BEFORE UPDATE ON photographer_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Supabase Storage bucket for portfolio photos
-- Note: Run this in the Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('elijahmedia-photos', 'elijahmedia-photos', true);

-- ============================================
-- Site Settings Table
-- Stores customizable site settings like hero background
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_site_settings_org_id ON site_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (for rendering site)
CREATE POLICY "Public can view settings"
  ON site_settings FOR SELECT
  USING (true);

-- Org members can manage settings
CREATE POLICY "Org members can manage settings"
  ON site_settings FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default hero settings
-- INSERT INTO site_settings (org_id, setting_key, setting_value) VALUES
--   ('<your-org-id>', 'hero', '{"background_url": null, "overlay_opacity": 0.7, "overlay_color": "#000000"}');
