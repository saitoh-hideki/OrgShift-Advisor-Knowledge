-- 理論MDA拡張のためのマイグレーション
-- 既存のtheoriesテーブルを拡張

-- 新しいカラムを追加
ALTER TABLE theories 
ADD COLUMN IF NOT EXISTS academic_field text,
ADD COLUMN IF NOT EXISTS definition text,
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS applicable_scenarios text,
ADD COLUMN IF NOT EXISTS key_concepts jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS practical_tips jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS related_theories text[] DEFAULT '{}';

-- カテゴリー別のインデックスを作成
CREATE INDEX IF NOT EXISTS idx_theories_domain ON theories(domain);
CREATE INDEX IF NOT EXISTS idx_theories_academic_field ON theories(academic_field);

-- 理論カテゴリーの列挙型を作成
CREATE TYPE theory_domain AS ENUM (
  'behavioral_econ',      -- 行動経済学
  'leadership',           -- リーダーシップ論
  'organizational_psych', -- 組織心理学
  'communication',         -- コミュニケーション理論
  'sales_marketing',      -- 営業・マーケティング理論
  'innovation',           -- イノベーション理論
  'operations',           -- オペレーション理論
  'finance'               -- ファイナンス理論
);

-- 既存のdomainカラムの値を新しいENUM型に適合するように更新
UPDATE theories SET domain = 'organizational_psych' WHERE domain = 'psychology';
UPDATE theories SET domain = 'behavioral_econ' WHERE domain = 'behavioral';
UPDATE theories SET domain = 'leadership' WHERE domain = 'leadership_org';
UPDATE theories SET domain = 'communication' WHERE domain = 'negotiation';

-- 既存のdomainカラムを新しい型に変換
ALTER TABLE theories 
ALTER COLUMN domain TYPE theory_domain 
USING domain::theory_domain;

-- コメントを追加
COMMENT ON TABLE theories IS '理論MDA（Master Data of Theories）';
COMMENT ON COLUMN theories.academic_field IS '学問分野（例：行動経済学、組織心理学）';
COMMENT ON COLUMN theories.definition IS '理論の定義';
COMMENT ON COLUMN theories.content IS '理論の詳細内容';
COMMENT ON COLUMN theories.applicable_scenarios IS '適用可能な場面';
COMMENT ON COLUMN theories.key_concepts IS 'キーコンセプトの配列';
COMMENT ON COLUMN theories.practical_tips IS '実践のコツの配列';
COMMENT ON COLUMN theories.related_theories IS '関連理論のID配列';
