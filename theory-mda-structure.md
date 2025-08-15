# 理論MDA（Master Data of Theories）構造設計

## カテゴリー分類

### 1. 行動経済学（Behavioral Economics）– 20件
- 意思決定・判断の心理的バイアス
- 価値評価・選択行動の理論

### 2. リーダーシップ論（Leadership Theory）– 20件
- リーダーシップスタイル・手法
- 組織変革・人材育成

### 3. 組織心理学（Organizational Psychology）– 20件
- チーム・組織の心理・行動
- モチベーション・エンゲージメント

### 4. コミュニケーション理論（Communication Theory）– 20件
- 対人コミュニケーション・交渉
- プレゼンテーション・ファシリテーション

### 5. 営業・マーケティング理論（Sales & Marketing Theory）– 20件
- 顧客心理・購買行動
- 営業手法・マーケティング戦略

## 各理論の構造

```json
{
  "id": "理論ID",
  "name_ja": "日本語名",
  "name_en": "英語名",
  "domain": "カテゴリー",
  "academic_field": "学問分野",
  "one_liner": "一言説明",
  "definition": "定義",
  "content": "内容",
  "applicable_scenarios": "使える場面",
  "key_concepts": ["キーコンセプト"],
  "examples": ["具体例"],
  "practical_tips": ["実践のコツ"],
  "mechanism": "メカニズム",
  "how_to": ["実践方法"],
  "templates": {
    "meeting": "会議での使用例",
    "sales": "営業での使用例",
    "presentation": "プレゼンでの使用例",
    "interview": "面談での使用例",
    "team_building": "チーム構築での使用例"
  },
  "tags": ["タグ"],
  "related_theories": ["関連理論ID"]
}
```

## 実装計画

1. **第1段階**: 行動経済学20件の詳細実装
2. **第2段階**: リーダーシップ論20件の詳細実装
3. **第3段階**: 組織心理学20件の詳細実装
4. **第4段階**: コミュニケーション理論20件の詳細実装
5. **第5段階**: 営業・マーケティング理論20件の詳細実装

## データベース設計

- `theories` テーブルの拡張
- カテゴリー別のインデックス
- シーン別テンプレートの充実
- 関連理論の相互参照
