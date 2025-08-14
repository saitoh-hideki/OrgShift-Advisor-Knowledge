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
  // シーン固有の設定
  meetingTypes?: string[]; // 会議・ミーティング用
  meetingFormats?: string[]; // 会議・ミーティング用
  customerTypes?: string[]; // 営業・商談用
  industries?: string[]; // 営業・商談用
  customerPositions?: string[]; // 営業・商談用
  companySizes?: string[]; // 営業・商談用
  salesStages?: string[]; // 営業・商談用
  presentationPurposes?: string[]; // プレゼンテーション用
  audienceTypes?: string[]; // プレゼンテーション用
  presentationFormats?: string[]; // プレゼンテーション用
  interviewTypes?: string[]; // 面談用
  interviewRelationships?: string[]; // 面談用
  interviewPurposes?: string[]; // 面談用
  teamBuildingTypes?: string[]; // チーム構築用
  teamMaturities?: string[]; // チーム構築用
  teamContexts?: string[]; // チーム構築用
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
      '報告会'
    ],
    meetingFormats: ['対面', 'オンライン', 'ハイブリッド']
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
    participants: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 営業でも複数人での商談に対応
    relationships: ['新規顧客', '既存顧客', '代理店', 'パートナー'],
    customerTypes: ['新規顧客', '既存顧客', '代理店', 'パートナー'],
    industries: ['IT', '製造', '金融', '医療', '小売', 'サービス', '建設', '教育'],
    customerPositions: ['担当者', '課長', '部長', '取締役', '社長'],
    companySizes: ['中小企業', '大企業', 'スタートアップ'],
    salesStages: ['初回アプローチ', '提案', 'クロージング', 'フォローアップ']
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
    presentationPurposes: ['提案', '報告', '教育', '説得', '紹介'],
    audienceTypes: ['社内', '顧客', '投資家', 'パートナー', '一般'],
    presentationFormats: ['対面', 'オンライン', 'ハイブリッド']
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
    participants: [2], // 面談は通常1対1
    relationships: ['上司-部下', '人事-従業員', '外部コンサルタント-クライアント'],
    interviewTypes: ['採用面接', '評価面談', '退職面談', '相談', '指導'],
    interviewRelationships: ['上司-部下', '人事-従業員', '外部コンサルタント-クライアント'],
    interviewPurposes: ['評価', '指導', '相談解決', '関係構築']
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
    teamBuildingTypes: ['新チーム構築', '既存チーム強化', 'チーム再編成', 'プロジェクトチーム', '部門統合'],
    teamMaturities: ['形成期', '混乱期', '規範期', '実行期', '解散期'],
    teamContexts: ['新規プロジェクト', '既存業務改善', '組織変革', '危機対応', '日常業務']
  }
];

export const getSceneConfig = (sceneId: string): SceneConfig | undefined => {
  return sceneConfigs.find(config => config.id === sceneId);
};

export const getSceneName = (sceneId: string): string => {
  const config = getSceneConfig(sceneId);
  return config ? config.name : sceneId;
};
