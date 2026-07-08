-- Dedicated company name for the PDF letterhead, separate from the profile's
-- personal/display name. The PDF prefers company_name and falls back to name.
ALTER TABLE profiles ADD COLUMN company_name TEXT NOT NULL DEFAULT '';
