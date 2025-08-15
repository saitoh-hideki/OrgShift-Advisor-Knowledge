// シーン別の詳細設定とゴールの種類
export interface SceneConfig {
  id: string;
  name: string;
  description: string;
  goals: string[];
  timeLimits: string[];
  stakes: string[];
  participants?: number[];
  relationships?: string[];
  
  // 会議・ミーティング用の詳細設定
  meetingTypes?: string[];
  meetingFormats?: string[];
  meetingUrgency?: string[]; // 緊急度
  meetingFrequency?: string[]; // 頻度
  meetingParticipants?: string[]; // 参加者タイプ
  meetingTools?: string[]; // 使用ツール
  meetingChallenges?: string[]; // 想定される課題
  
  // 営業・商談用の詳細設定
  customerTypes?: string[];
  industries?: string[];
  customerPositions?: string[];
  companySizes?: string[];
  salesStages?: string[];
  dealSize?: string[]; // 商談規模
  competitionLevel?: string[]; // 競合レベル
  customerPainPoints?: string[]; // 顧客の課題
  
  // プレゼンテーション用の詳細設定
  presentationPurposes?: string[];
  audienceTypes?: string[];
  presentationFormats?: string[];
  presentationTopics?: string[]; // プレゼン内容
  audienceExpertise?: string[]; // 聴衆の専門性
  presentationConstraints?: string[]; // 制約事項
  
  // 面談用の詳細設定
  interviewTypes?: string[];
  interviewRelationships?: string[];
  interviewPurposes?: string[];
  interviewContext?: string[]; // 面談の文脈
  interviewOutcomes?: string[]; // 期待される成果
  
  // チーム構築用の詳細設定
  teamBuildingTypes?: string[];
  teamMaturities?: string[];
  teamContexts?: string[];
  teamSize?: string[]; // チーム規模
  teamDiversity?: string[]; // チームの多様性
  teamChallenges?: string[]; // チームの課題
}

export const sceneConfigs: SceneConfig[] = [
  {
    id: 'meeting',
    name: '会議・ミーティング',
    description: '効果的な会議の進行と意思決定のためのチェックリスト',
    goals: [
      '議題の明確化と合意形成',
      '参加者の準備とエンゲージメント',
      '時間管理と進行の最適化',
      '意思決定プロセスの確立',
      'アクションアイテムの設定とフォローアップ'
    ],
    timeLimits: ['30分以内', '1時間以内', '2時間以内', '半日', '1日'],
    stakes: ['低', '中', '高', '極めて重要'],
    participants: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    relationships: ['上司', '同僚', '部下', '他部署', 'クライアント', 'ベンダー'],
    meetingTypes: [
      '定例会議',
      'プロジェクト会議',
      '意思決定会議',
      'ブレインストーミング',
      '報告会',
      '問題解決会議',
      '計画策定会議',
      '振り返り会議'
    ],
    meetingFormats: ['対面', 'オンライン', 'ハイブリッド'],
    meetingUrgency: ['通常', '緊急', '重要', '緊急かつ重要'],
    meetingFrequency: ['初回', '毎日', '毎週', '毎月', '四半期', '年次', '不定期'],
    meetingParticipants: ['経営陣', '管理職', '一般社員', '外部関係者', '混合'],
    meetingTools: ['Zoom', 'Teams', 'Google Meet', 'Slack', 'Miro', 'Notion', 'その他'],
    meetingChallenges: [
      '参加者の準備不足',
      '時間超過',
      '意思決定の遅延',
      '参加者の発言が少ない',
      '議題の脱線',
      '技術的問題',
      '文化的な違い'
    ]
  },
  {
    id: 'sales',
    name: '営業・商談',
    description: '顧客との効果的な関係構築とクロージングのためのチェックリスト',
    goals: [
      '顧客ニーズの深掘りと課題の特定',
      '競合他社との差別化と価値提案',
      '信頼関係の構築と長期的パートナーシップ',
      '効果的なクロージングと契約締結',
      '顧客満足度の向上とリピート獲得'
    ],
    timeLimits: ['30分以内', '1時間以内', '2時間以内', '半日', '1日'],
    stakes: ['低', '中', '高', '極めて重要'],
    participants: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    relationships: ['新規顧客', '既存顧客', '代理店', 'パートナー'],
    customerTypes: ['新規顧客', '既存顧客', '代理店', 'パートナー'],
    industries: ['IT', '製造', '金融', '医療', '小売', 'サービス', '建設', '教育', '物流', '不動産', 'メディア', 'エンターテイメント'],
    customerPositions: ['担当者', '課長', '部長', '取締役', '社長', 'CEO', 'CTO', 'CFO'],
    companySizes: ['スタートアップ', '中小企業', '大企業', '上場企業', '外資系'],
    salesStages: ['初回アプローチ', 'ニーズヒアリング', '提案', 'クロージング', 'フォローアップ', '拡販'],
    dealSize: ['小規模（100万円未満）', '中規模（100万円〜1000万円）', '大規模（1000万円〜1億円）', '超大規模（1億円以上）'],
    competitionLevel: ['独占', '寡占', '競争激しい', '新規市場'],
    customerPainPoints: [
      'コスト削減',
      '業務効率化',
      '品質向上',
      'リスク管理',
      '人材不足',
      '技術革新',
      '規制対応',
      '顧客満足度向上'
    ]
  },
  {
    id: 'presentation',
    name: 'プレゼンテーション',
    description: '聴衆の関心を引き、メッセージを効果的に伝えるためのチェックリスト',
    goals: [
      '聴衆の関心事とニーズの把握',
      '明確で魅力的なメッセージの設計',
      '視覚的資料の効果的な活用',
      '自信を持ったデリバリーと聴衆エンゲージメント',
      '質疑応答への適切な対応'
    ],
    timeLimits: ['5分以内', '15分以内', '30分以内', '1時間以内', '2時間以内'],
    stakes: ['低', '中', '高', '極めて重要'],
    participants: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    relationships: ['社内', '顧客', '投資家', 'パートナー', '一般'],
    presentationPurposes: ['提案', '報告', '教育', '説得', '紹介', 'ピッチ', 'デモンストレーション', 'ワークショップ'],
    audienceTypes: ['社内', '顧客', '投資家', 'パートナー', '一般', '専門家', '学生', 'メディア'],
    presentationFormats: ['対面', 'オンライン', 'ハイブリッド'],
    presentationTopics: [
      '新製品・サービス',
      '事業計画',
      '研究結果',
      'プロジェクト進捗',
      '財務報告',
      '組織改革',
      '技術解説',
      '成功事例'
    ],
    audienceExpertise: ['初心者', '一般', '専門的', 'エキスパート', '混合'],
    presentationConstraints: [
      '時間制限が厳しい',
      '技術的問題の可能性',
      '言語の壁',
      '文化的な違い',
      '聴衆の関心が低い',
      '競合他社の存在',
      '予算の制約'
    ]
  },
  {
    id: 'interview',
    name: '面談',
    description: '効果的なコミュニケーションと関係構築のためのチェックリスト',
    goals: [
      '面談の目的と目標の明確化',
      '相手の立場と関心事の理解',
      '効果的なコミュニケーションと信頼構築',
      '適切なフィードバックとアドバイスの提供',
      '面談後のフォローアップと継続的な関係性'
    ],
    timeLimits: ['15分以内', '30分以内', '1時間以内', '2時間以内', '半日'],
    stakes: ['低', '中', '高', '極めて重要'],
    participants: [2],
    relationships: ['上司-部下', '人事-従業員', '外部コンサルタント-クライアント'],
    interviewTypes: ['採用面接', '評価面談', '退職面談', '相談', '指導', '1on1', 'メンタリング', 'コーチング'],
    interviewRelationships: ['上司-部下', '人事-従業員', '外部コンサルタント-クライアント', 'メンター-メンティー', 'コーチ-クライアント'],
    interviewPurposes: ['評価', '指導', '相談解決', '関係構築', 'キャリア開発', 'パフォーマンス向上'],
    interviewContext: [
      '定期面談',
      '問題対応',
      'キャリア相談',
      '目標設定',
      '振り返り',
      '緊急対応',
      'フォローアップ'
    ],
    interviewOutcomes: [
      '目標の明確化',
      '行動計画の策定',
      '課題の解決',
      '関係性の改善',
      'スキル向上',
      'モチベーション向上',
      '具体的なアクション'
    ]
  },
  {
    id: 'team_building',
    name: 'チーム構築・チームビルディング',
    description: '高パフォーマンスチームの構築と維持のためのチェックリスト',
    goals: [
      'チームの目的とビジョンの明確化',
      'メンバーの強みを活かした役割分担',
      '効果的なコミュニケーション体制の確立',
      '信頼関係の構築とチーム文化の醸成',
      '継続的なチーム開発と成果の向上'
    ],
    timeLimits: ['1時間以内', '半日', '1日', '2日', '1週間'],
    stakes: ['低', '中', '高', '極めて重要'],
    participants: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    relationships: ['新チーム構築', '既存チーム強化', 'チーム再編成', 'プロジェクトチーム', '部門統合'],
    teamBuildingTypes: ['新チーム構築', '既存チーム強化', 'チーム再編成', 'プロジェクトチーム', '部門統合', 'リモートチーム構築', '多国籍チーム構築'],
    teamMaturities: ['形成期', '混乱期', '規範期', '実行期', '解散期', '再形成期'],
    teamContexts: ['新規プロジェクト', '既存業務改善', '組織変革', '危機対応', '日常業務', 'イノベーション推進', '品質向上'],
    teamSize: ['小規模（2-5人）', '中規模（6-15人）', '大規模（16-50人）', '超大規模（50人以上）'],
    teamDiversity: [
      '年齢の多様性',
      '性別の多様性',
      '文化的背景の多様性',
      '専門性の多様性',
      '経験レベルの多様性',
      '価値観の多様性'
    ],
    teamChallenges: [
      'コミュニケーション不足',
      '役割の不明確さ',
      '信頼関係の欠如',
      '目標の不一致',
      'リーダーシップの不在',
      '文化的な違い',
      'リモートワークの課題',
      'メンバーの離脱'
    ]
  }
];

export const getSceneConfig = (sceneId: string): SceneConfig | undefined => {
  return sceneConfigs.find(config => config.id === sceneId);
};

export const getSceneName = (sceneId: string): string => {
  const config = getSceneConfig(sceneId);
  return config ? config.name : sceneId;
};
