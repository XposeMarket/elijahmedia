-- Migration: Add Instagram handle and personal shoot styles to photographer_bookings
ALTER TABLE photographer_bookings
ADD COLUMN instagram_handle TEXT NOT NULL DEFAULT '',
ADD COLUMN personal_styles JSONB,
ADD COLUMN personal_styles_total NUMERIC;
