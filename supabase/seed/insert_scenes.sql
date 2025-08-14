-- 新しいシーンデータを挿入
INSERT INTO scenes (id, name) VALUES
  ('meeting', '会議'),
  ('sales', '営業'),
  ('one_on_one', '1on1'),
  ('presentation', 'プレゼン'),
  ('negotiation', '交渉'),
  ('team_building', 'チーム構築'),
  ('crisis_management', '危機管理'),
  ('change_management', '組織変革'),
  ('performance_review', '評価面談'),
  ('stakeholder_meeting', 'ステークホルダー会議')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;
