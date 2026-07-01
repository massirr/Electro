-- profiles: extends auth.users with electrician-specific fields
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  btw_number  TEXT NOT NULL DEFAULT '',
  hourly_rate NUMERIC NOT NULL DEFAULT 85,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row when a new auth user signs in for the first time
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- projects
CREATE TABLE projects (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner            UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  project_date     DATE,
  hourly_rate      NUMERIC NOT NULL,
  margin_percent   NUMERIC NOT NULL,
  job_type         TEXT NOT NULL CHECK (job_type IN ('renovation', 'new-build')),
  grand_total      NUMERIC NOT NULL DEFAULT 0,
  customer_name    TEXT NOT NULL DEFAULT '',
  customer_email   TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- takeoff_items: cascade-delete when project is deleted
CREATE TABLE takeoff_items (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  external_item_id TEXT NOT NULL,
  name             TEXT NOT NULL,
  quantity         NUMERIC NOT NULL,
  hours_per_unit   NUMERIC NOT NULL
);

-- Row Level Security: users only see and modify their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_own_projects"
  ON projects FOR ALL
  USING (auth.uid() = owner)
  WITH CHECK (auth.uid() = owner);

CREATE POLICY "users_own_takeoff_items"
  ON takeoff_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_id AND projects.owner = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_id AND projects.owner = auth.uid()
  ));
