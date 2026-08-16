CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  normalized_url VARCHAR(500) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(255),
  notes TEXT,
  categories JSONB DEFAULT '[]',
  added_by VARCHAR(100),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  analysis JSONB
);

CREATE TABLE IF NOT EXISTS categories (
  name VARCHAR(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS docs (
  category VARCHAR(100) PRIMARY KEY,
  doc_text TEXT,
  updated_at TIMESTAMPTZ,
  sources INT
);

INSERT INTO categories (name) VALUES
  ('Economia'),('Ambiente'),('Feminismos'),('Politica'),
  ('Tecnologia'),('Salud'),('Cultura'),('Internacional')
ON CONFLICT (name) DO NOTHING;
