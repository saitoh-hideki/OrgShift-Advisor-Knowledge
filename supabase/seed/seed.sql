-- Scenes seed data
INSERT INTO scenes (id, name) VALUES
  ('meeting', '会議'),
  ('sales', '営業'),
  ('one_on_one', '1on1')
ON CONFLICT (id) DO NOTHING;