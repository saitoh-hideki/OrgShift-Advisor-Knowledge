# OrgShift Advisor & Knowledge

AI駆動のビジネスアドバイザーアプリケーション。組織変革とリーダーシップの専門知識を提供し、シーン別の詳細なアドバイスと理論学習をサポートします。

## 🚀 機能

### シーン別専門アドバイザー
- **会議・ミーティング**: 会議の種類、形式に応じた専門アドバイス
- **営業・商談**: 業界、顧客タイプ、営業段階に特化したアドバイス
- **プレゼンテーション**: 目的、聴衆、形式に応じた効果的なアドバイス
- **面談**: 面談の種類、目的、関係性に基づくアドバイス
- **チーム構築**: チームの成熟度、状況に応じたビルディング戦略

### AI機能
- シーン固有の詳細設定を活用した専門的アドバイス生成
- 動的チェックリスト生成
- 関連理論の自動生成と学習支援
- 最近使用したアドバイスの永続化

### 技術的特徴
- React Native モバイルアプリ
- Supabase Edge Functions (Deno)
- OpenAI GPT-4o-mini 統合
- 詳細設計に基づく専門家レベルのプロンプト

## 🏗️ アーキテクチャ

```
orgshift/
├── mobile/                 # React Native モバイルアプリ
│   ├── App.tsx            # メインアプリケーション
│   ├── src/
│   │   ├── api.ts         # API通信
│   │   ├── scene-configs.ts # シーン設定
│   │   └── ChecklistComponent.tsx # チェックリストコンポーネント
├── supabase/               # Supabase バックエンド
│   ├── functions/          # Edge Functions
│   │   ├── advice/         # メインアドバイスルーター
│   │   ├── advice-[scene]/ # シーン別専門アドバイザー
│   │   ├── checklist/      # チェックリストルーター
│   │   ├── checklist-[scene]/ # シーン別チェックリスト
│   │   ├── theory/         # 理論学習
│   │   └── recent-advices/ # 最近のアドバイス管理
│   ├── migrations/         # データベースマイグレーション
│   └── seed/               # 初期データ
└── web-admin/              # Web管理画面
```

## 🛠️ セットアップ

### 前提条件
- Node.js 18+
- npm または yarn
- Supabase CLI
- OpenAI API キー

### 1. リポジトリのクローン
```bash
git clone https://github.com/saitoh-hideki/OrgShift-Advisor-Knowledge.git
cd OrgShift-Advisor-Knowledge
```

### 2. 依存関係のインストール
```bash
# モバイルアプリ
cd mobile
npm install

# Supabase CLI
npm install -g @supabase/cli
```

### 3. 環境設定
```bash
# Supabase プロジェクトのリンク
cd ../supabase
npx supabase link --project-ref YOUR_PROJECT_REF

# 環境変数の設定
cp .env.example .env
# .env ファイルに OpenAI API キーを設定
```

### 4. データベースのセットアップ
```bash
# マイグレーションの適用
npx supabase db push

# Edge Functions のデプロイ
npx supabase functions deploy --no-verify-jwt
```

### 5. モバイルアプリの起動
```bash
cd ../mobile
npx expo start
```

## 📱 使用方法

### 1. シーン選択
- メイン画面から5つのシーンのいずれかを選択
- 各シーンに特化した詳細設定を入力

### 2. アドバイス取得
- 基本設定と詳細設定を入力
- AIがシーン固有の専門的アドバイスを生成

### 3. チェックリスト作成
- アドバイス取得前に動的チェックリストを生成
- シーンと状況に応じた準備項目を提示

### 4. 理論学習
- アドバイスに関連する理論を学習
- AIが理論の詳細説明を自動生成

## 🔧 開発

### Edge Functions の追加
```bash
cd supabase/functions
mkdir advice-new-scene
# 新しいシーン用のアドバイス関数を作成
npx supabase functions deploy advice-new-scene --no-verify-jwt
```

### データベーススキーマの変更
```bash
cd supabase
# 新しいマイグレーションファイルを作成
# マイグレーションを適用
npx supabase db push
```

## 📊 データベーススキーマ

### 主要テーブル
- `scenes`: シーン定義
- `theories`: 理論データ
- `sessions`: セッション管理
- `session_advices`: セッションとアドバイスの関連
- `recent_advices`: 最近使用したアドバイス
- `feedbacks`: フィードバックデータ

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🆘 サポート

問題や質問がある場合は、GitHubのIssuesページで報告してください。

---

**OrgShift Advisor & Knowledge** - AI駆動のビジネスアドバイザーで、あなたのビジネススキルを次のレベルへ。