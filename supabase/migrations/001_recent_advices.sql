-- 最近使用したアドバイスを保存するテーブル
CREATE TABLE IF NOT EXISTS recent_advices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scene_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  time_limit TEXT NOT NULL,
  stakes TEXT NOT NULL,
  participants INTEGER,
  relationship TEXT,
  theory_id TEXT NOT NULL,
  short_advice TEXT NOT NULL,
  expected_effect TEXT NOT NULL,
  caution TEXT,
  tips TEXT,
  related_theory TEXT,
  implementation_steps TEXT[],
  success_indicators TEXT[],
  common_mistakes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_recent_advices_user_id ON recent_advices(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_advices_created_at ON recent_advices(created_at);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recent_advices_updated_at 
  BEFORE UPDATE ON recent_advices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- プロトタイプ版: RLSを無効化して誰でもアクセス可能
-- ALTER TABLE recent_advices ENABLE ROW LEVEL SECURITY;
