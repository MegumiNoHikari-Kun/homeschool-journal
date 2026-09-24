-- 1. Profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('parent', 'mentor', 'child')) DEFAULT 'parent',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    color TEXT
);
INSERT INTO categories (name, slug, icon, color) VALUES
('Sains & Alam', 'sains-alam', 'flask', 'emerald'),
('Matematika', 'matematika', 'calculator', 'blue'),
('Seni & Kriya', 'seni-kriya', 'palette', 'purple'),
('Sosial & Budaya', 'sosial-budaya', 'globe', 'amber');

-- 3. Activities
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id INT REFERENCES categories(id),
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    image_caption TEXT,
    video_url TEXT,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Profil otomatis dibuat saat user mendaftar
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles dibaca semua" ON profiles FOR SELECT USING (true);
CREATE POLICY "profil sendiri diubah" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "kategori dibaca semua" ON categories FOR SELECT USING (true);
CREATE POLICY "jurnal dibaca semua" ON activities FOR SELECT USING (true);
CREATE POLICY "jurnal sendiri ditambah" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jurnal sendiri diubah" ON activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "jurnal sendiri dihapus" ON activities FOR DELETE USING (auth.uid() = user_id);

-- 6. Fungsi like (+1)
CREATE OR REPLACE FUNCTION like_activity(activity_id BIGINT) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE activities SET likes_count = likes_count + 1 WHERE id = activity_id;
$$;

-- 7. Storage untuk foto
INSERT INTO storage.buckets (id, name, public) VALUES ('journal', 'journal', true);
CREATE POLICY "foto dibaca semua" ON storage.objects FOR SELECT USING (bucket_id = 'journal');
CREATE POLICY "upload ke folder sendiri" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'journal' AND (storage.foldername(name))[1] = auth.uid()::text);
