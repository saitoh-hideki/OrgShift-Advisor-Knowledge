-- 理論の種類と件数を確認するSQL

-- 1. academic_field別の理論数
SELECT 
  academic_field,
  COUNT(*) as count
FROM theories 
GROUP BY academic_field 
ORDER BY count DESC;

-- 2. domain別の理論数
SELECT 
  domain,
  COUNT(*) as count
FROM theories 
GROUP BY domain 
ORDER BY count DESC;

-- 3. 全理論の一覧（最初の10件）
SELECT 
  id,
  name_ja,
  academic_field,
  domain
FROM theories 
ORDER BY academic_field, name_ja
LIMIT 10;

-- 4. ファイナンス・メトリクス関連の理論
SELECT 
  id,
  name_ja,
  academic_field,
  domain
FROM theories 
WHERE academic_field LIKE '%ファイナンス%' 
   OR academic_field LIKE '%メトリクス%'
   OR domain = 'finance'
ORDER BY name_ja;

-- 5. 営業・マーケティング関連の理論
SELECT 
  id,
  name_ja,
  academic_field,
  domain
FROM theories 
WHERE academic_field LIKE '%営業%' 
   OR academic_field LIKE '%マーケティング%'
   OR domain = 'sales_marketing'
ORDER BY name_ja;

-- 6. 全理論の総数
SELECT COUNT(*) as total_theories FROM theories;
