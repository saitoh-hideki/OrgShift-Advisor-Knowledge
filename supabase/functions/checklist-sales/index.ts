// 営業・商談専用のチェックリスト生成Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, type AIContext } from "../_shared/ai-utils.ts"
import { adminClient, diagnoseEnvironment } from "../_shared/client.ts"

interface SalesChecklistRequest {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  customer_type: string; // 新規顧客、既存顧客、代理店、パートナー
  industry: string; // IT、製造、金融、医療、小売、サービス、建設、教育
  customer_position: string; // 担当者、課長、部長、取締役、社長
  company_size: string; // 中小企業、大企業、スタートアップ
  sales_stage: string; // 初回アプローチ、提案、クロージング、フォローアップ
  additional_context?: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  description: string;
  importance: 'critical' | 'important' | 'recommended';
  examples: string[];
  reasoning: string;
  timing: string;
  specific_advice: string; // 営業特有の具体的なアドバイス
}

interface ChecklistResponse {
  checklist: ChecklistItem[];
  summary: string;
  recommendations: string[];
  sales_specific_tips: string[]; // 営業特有のコツ
  industry_topics: string[]; // 業界のトピック
  preparation_timeline: string[]; // 準備のタイムライン
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    // 環境変数の診断
    const envDiagnosis = diagnoseEnvironment();
    console.log('Environment diagnosis:', envDiagnosis);
    
    const body: SalesChecklistRequest = await req.json()
    console.log('Sales checklist request received:', body);
    
    // 必須フィールドの検証
    if (!body.scene || !body.goal || !body.time_limit || !body.stakes || !body.customer_type || !body.industry || !body.customer_position || !body.company_size || !body.sales_stage) {
      console.error('Missing required fields:', body);
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: scene, goal, time_limit, stakes, customer_type, industry, customer_position, company_size, sales_stage are required' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    const context: AIContext = {
      scene: body.scene,
      goal: body.goal,
      timeLimit: body.time_limit,
      stakes: body.stakes,
      participants: 2, // 営業は通常1対1
      relationship: `${body.customer_type} - ${body.industry}業界 - ${body.customer_position}`
    };

    console.log('Processing sales context:', context);

    const prompt = `あなたは営業戦略と顧客関係構築の専門家で、営業・商談シーンに特化した最適なチェックリストを作成する専門家です。

【営業の詳細分析】
- シーン: ${context.scene} (営業・商談)
- 目標: ${body.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- 顧客タイプ: ${body.customer_type}
- 業界: ${body.industry}
- 顧客の役職: ${body.customer_position}
- 会社規模: ${body.company_size}
- 営業段階: ${body.sales_stage}
${body.additional_context ? `- 追加コンテキスト: ${body.additional_context}` : ''}

【営業シーン特化のチェックリスト作成要求】
この営業の状況に最適化された、実用的で効果的なチェックリストを作成してください。

【営業特有の構成要素】
各チェックリスト項目には以下を含めてください：

1. **カテゴリ**: 顧客分析、営業準備、アプローチ、提案、クロージング、フォローアップなど
2. **質問**: 営業特有の具体的で確認しやすい質問
3. **説明**: なぜこの項目が営業の成功に重要なのかの理由
4. **重要度**: critical（必須）、important（重要）、recommended（推奨）
5. **例**: 営業特有の具体的な実践例（3-5個）
6. **理由**: この項目がなぜこの重要度なのかの説明
7. **タイミング**: 営業のどの段階で確認すべきかの指針
8. **具体的アドバイス**: この項目に関する具体的で実践的なアドバイス

【営業特有の重要度基準】
- **Critical（必須）**: この項目が完了しないと営業の成功が困難
- **Important（重要）**: この項目が完了すると営業の成功率が大幅に向上
- **Recommended（推奨）**: この項目が完了すると営業の品質が向上

【営業段階別特化項目】

**${body.sales_stage}の場合:**
${getSalesStageSpecificPrompt(body.sales_stage)}

**顧客タイプ別の考慮事項:**
${getCustomerTypeSpecificPrompt(body.customer_type)}

**業界別の考慮事項:**
${getIndustrySpecificPrompt(body.industry)}

**顧客役職別の考慮事項:**
${getCustomerPositionSpecificPrompt(body.customer_position)}

**会社規模別の考慮事項:**
${getCompanySizeSpecificPrompt(body.company_size)}

【出力形式】
JSON形式で返してください：
{
  "checklist": [
    {
      "id": "unique_id",
      "category": "カテゴリ名",
      "question": "具体的な質問",
      "description": "項目の説明",
      "importance": "critical|important|recommended",
      "examples": ["例1", "例2", "例3"],
      "reasoning": "この重要度である理由",
      "timing": "確認すべきタイミング",
      "specific_advice": "この項目に関する具体的で実践的なアドバイス"
    }
  ],
  "summary": "この営業チェックリストの概要と目的",
  "recommendations": [
    "営業チェックリスト使用時の推奨事項1",
    "営業チェックリスト使用時の推奨事項2",
    "営業チェックリスト使用時の推奨事項3"
  ],
  "sales_specific_tips": [
    "この営業段階に特化したコツ1",
    "この営業段階に特化したコツ2",
    "この営業段階に特化したコツ3"
  ],
  "industry_topics": [
    "この業界の最新トピック1",
    "この業界の最新トピック2",
    "この業界の最新トピック3"
  ],
  "preparation_timeline": [
    "営業前の準備タイムライン1",
    "営業前の準備タイムライン2",
    "営業前の準備タイムライン3"
  ]
}

【営業特有の専門的視点】
- 顧客の購買サイクルに応じたアプローチの最適化
- 競合状況に応じた差別化戦略の策定
- 顧客の組織構造に応じた意思決定者へのアプローチ
- 時間制限に応じた営業戦略の調整
- 長期的な顧客関係構築の視点
- 業界特有の課題とソリューションの理解`

    try {
      console.log('Calling AI for sales checklist...');
      const aiResponse = await generateAIAdvice(prompt, context);
      console.log('AI response received for sales:', aiResponse);
      
      // AIレスポンスからチェックリストを抽出
      const checklistData = extractChecklistFromAIResponse(aiResponse);
      console.log('Extracted sales checklist data:', checklistData);
      
      return new Response(JSON.stringify(checklistData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (error) {
      console.error("AI generation failed for sales:", error);
      // フォールバック用の営業特化チェックリスト
      const fallbackChecklist = generateSalesFallbackChecklist(body);
      console.log('Using sales fallback checklist:', fallbackChecklist);
      return new Response(JSON.stringify(fallbackChecklist), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  } catch (error) {
    console.error('Sales checklist function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
});

// 営業段階別特化プロンプト
function getSalesStageSpecificPrompt(salesStage: string): string {
  const salesStagePrompts: Record<string, string> = {
    '初回アプローチ': `初回アプローチ特有の項目を含めてください：
- 顧客の基本情報と業界動向の調査
- 初回コンタクトの方法とタイミング
- 顧客の関心を引くアプローチ方法
- 信頼関係構築のための準備
- 次回アポイントの設定方法`,

    '提案': `提案段階特有の項目を含めてください：
- 顧客ニーズの深掘りと課題の特定
- 競合他社の分析と差別化ポイント
- 価値提案の最適化と提案書の準備
- 提案プレゼンテーションの練習
- 顧客の反応とフィードバックの収集`,

    'クロージング': `クロージング段階特有の項目を含めてください：
- 反対意見への対応準備と戦略
- クロージングのタイミングと方法
- 価格交渉と条件調整の準備
- 最終提案と契約条件の提示
- 合意形成と契約締結のプロセス`,

    'フォローアップ': `フォローアップ段階特有の項目を含めてください：
- 顧客満足度の確認と評価
- 追加機会の創出と提案
- 長期的関係性の構築方法
- 顧客紹介とリファラルの促進
- 継続的な価値提供の計画`
  };

  return salesStagePrompts[salesStage] || `一般的な営業の項目を含めてください：
- 顧客ニーズの把握と分析
- 営業戦略の策定と実行
- 関係性の構築と維持
- 成果の測定と改善`;
}

// 顧客タイプ別特化プロンプト
function getCustomerTypeSpecificPrompt(customerType: string): string {
  const customerTypePrompts: Record<string, string> = {
    '新規顧客': `新規顧客特有の考慮事項：
- 顧客の基本情報と業界動向の調査
- 初回コンタクトの方法とタイミング
- 信頼関係構築のための準備
- 顧客の課題とニーズの特定
- 長期的な関係性構築の視点`,

    '既存顧客': `既存顧客特有の考慮事項：
- 過去の取引履歴と満足度の確認
- 現在の課題と新たなニーズの把握
- アップセル・クロスセルの機会
- 顧客の成功事例と価値の可視化
- 継続的な関係性の強化`,

    '代理店': `代理店特有の考慮事項：
- 代理店の営業力と市場カバレッジ
- 利益配分とサポート体制の構築
- 代理店との連携と情報共有
- 代理店の教育とトレーニング
- 長期的なパートナーシップの構築`,

    'パートナー': `パートナー特有の考慮事項：
- パートナーの強みと補完関係
- 共同提案とソリューション開発
- パートナーとの連携体制
- 相互利益の創出と共有
- 戦略的パートナーシップの構築`
  };

  return customerTypePrompts[customerType] || '- 顧客タイプに応じた適切なアプローチの検討';
}

// 業界別特化プロンプト
function getIndustrySpecificPrompt(industry: string): string {
  const industryPrompts: Record<string, string> = {
    'IT': `IT業界特有の考慮事項：
- 技術トレンドと最新動向の把握
- セキュリティとコンプライアンスの理解
- クラウド化とDXの課題
- スケーラビリティと柔軟性の要求
- 技術サポートと保守体制の重要性`,

    '製造': `製造業界特有の考慮事項：
- 生産性向上とコスト削減の課題
- 品質管理と安全規制の理解
- サプライチェーンの最適化
- 設備投資とROIの重要性
- グローバル競争と技術革新`,

    '金融': `金融業界特有の考慮事項：
- 規制とコンプライアンスの厳格性
- リスク管理とセキュリティの重要性
- 顧客データの保護とプライバシー
- デジタル化とフィンテックの影響
- 顧客の信頼性とブランド価値`,

    '医療': `医療業界特有の考慮事項：
- 医療規制とコンプライアンスの理解
- 患者の安全性と品質管理
- 医療費削減と効率化の要求
- 最新医療技術とトレンドの把握
- 医療従事者のワークフロー改善`,

    '小売': `小売業界特有の考慮事項：
- 顧客体験とブランド価値の向上
- 在庫管理とサプライチェーンの最適化
- オンライン・オフライン統合の課題
- 顧客データとマーケティングの活用
- 競合他社との差別化戦略`,

    'サービス': `サービス業界特有の考慮事項：
- 顧客満足度とサービス品質の向上
- 従業員のスキルと教育の重要性
- サービスプロセスの標準化と改善
- 顧客フィードバックと改善サイクル
- ブランド価値と顧客ロイヤリティ`,

    '建設': `建設業界特有の考慮事項：
- プロジェクト管理とスケジュール管理
- 安全性と品質管理の重要性
- コスト管理と利益率の最適化
- 技術革新とサステナビリティ
- 人材不足とスキル開発の課題`,

    '教育': `教育業界特有の考慮事項：
- 学習効果と教育品質の向上
- デジタル化とオンライン教育の課題
- 個別指導とカスタマイズの重要性
- 教育コストとアクセシビリティ
- 生涯学習とスキル開発のニーズ`
  };

  return industryPrompts[industry] || '- 業界特有の課題とニーズの理解';
}

// 顧客役職別特化プロンプト
function getCustomerPositionSpecificPrompt(customerPosition: string): string {
  const positionPrompts: Record<string, string> = {
    '担当者': `担当者レベルの考慮事項：
- 日常業務の課題と改善点の把握
- 上司への提案と承認プロセスの理解
- 実用的で効果的なソリューションの提示
- 導入後のサポートとトレーニングの重要性
- コスト対効果の明確な説明`,

    '課長': `課長レベルの考慮事項：
- 部門の課題と目標の理解
- 予算管理と投資判断の重要性
- チーム全体への影響と効果の説明
- 競合他社との比較と差別化
- 長期的な価値とROIの提示`,

    '部長': `部長レベルの考慮事項：
- 部門戦略と会社全体の目標との整合性
- 投資対効果とリスク管理の重要性
- ステークホルダーへの影響と説明
- 競合他社との戦略的差別化
- 長期的なパートナーシップの価値`,

    '取締役': `取締役レベルの考慮事項：
- 会社戦略と経営目標との整合性
- 投資対効果とリスク管理の重要性
- 株主とステークホルダーへの説明
- 競合他社との戦略的差別化
- 長期的な成長と価値創出の可能性`,

    '社長': `社長レベルの考慮事項：
- 会社のビジョンと戦略との整合性
- 投資対効果とリスク管理の重要性
- 株主とステークホルダーへの説明
- 競合他社との戦略的差別化
- 長期的な成長と価値創出の可能性`
  };

  return positionPrompts[customerPosition] || '- 顧客の役職に応じた適切なアプローチの検討';
}

// 会社規模別特化プロンプト
function getCompanySizeSpecificPrompt(companySize: string): string {
  const sizePrompts: Record<string, string> = {
    '中小企業': `中小企業特有の考慮事項：
- 限られた予算とリソースの最適化
- 迅速な導入と効果の実感
- 柔軟性とカスタマイズの重要性
- 長期的なサポートとパートナーシップ
- 成長に応じたスケーラビリティ`,

    '大企業': `大企業特有の考慮事項：
- 大規模な導入とシステム統合
- 複雑な組織構造と意思決定プロセス
- セキュリティとコンプライアンスの厳格性
- 長期的な投資対効果とROI
- グローバル展開と標準化`,

    'スタートアップ': `スタートアップ特有の考慮事項：
- 迅速な成長とスケーラビリティ
- 限られたリソースの効率的活用
- 革新的なソリューションの価値
- 長期的なパートナーシップの構築
- 投資家への説明と価値の可視化`
  };

  return sizePrompts[companySize] || '- 会社規模に応じた適切なアプローチの検討';
}

// AIレスポンスからチェックリストを抽出
function extractChecklistFromAIResponse(aiResponse: any): ChecklistResponse {
  try {
    console.log('Extracting sales checklist from AI response:', aiResponse);
    
    if (aiResponse) {
      // 直接チェックリストが含まれている場合
      if (aiResponse.checklist && Array.isArray(aiResponse.checklist)) {
        console.log('Found checklist in response');
        return aiResponse;
      }
      
      // アドバイスが含まれている場合
      if (aiResponse.advices && Array.isArray(aiResponse.advices)) {
        console.log('Found advices, converting to checklist format');
        return convertAdvicesToChecklist(aiResponse.advices);
      }
      
      // 配列の場合、最初の要素を確認
      if (Array.isArray(aiResponse) && aiResponse.length > 0) {
        const firstResponse = aiResponse[0];
        console.log('First response:', firstResponse);
        
        if (firstResponse.checklist && Array.isArray(firstResponse.checklist)) {
          console.log('Found checklist in first response');
          return firstResponse;
        }
        
        if (firstResponse.advices && Array.isArray(firstResponse.advices)) {
          console.log('Found advices in first response, converting to checklist format');
          return convertAdvicesToChecklist(firstResponse.advices);
        }
      }
    }
    
    // フォールバック
    console.log('Failed to extract sales checklist, using fallback');
    throw new Error("Failed to extract sales checklist from AI response");
  } catch (error) {
    console.error("Sales checklist extraction failed:", error);
    throw error;
  }
}

// アドバイスをチェックリスト形式に変換
function convertAdvicesToChecklist(advices: any[]): ChecklistResponse {
  const checklist = advices.map((advice, index) => ({
    id: `sales_advice_${index}`,
    category: "営業準備・実行",
    question: advice.short_advice || "この営業アドバイスは実行可能ですか？",
    description: advice.expected_effect || "営業の効果的な実行のための確認事項",
    importance: "important" as const,
    examples: [
      "具体的な営業計画を立てる",
      "必要な資料を準備する",
      "営業のタイミングを決める"
    ],
    reasoning: "この営業アドバイスの効果的な実行のため",
    timing: "営業開始前",
    specific_advice: "営業特有の具体的なアドバイス"
  }));

  return {
    checklist,
    summary: "AI生成された営業アドバイスをチェックリスト形式に変換しました。",
    recommendations: [
      "各営業項目を順番に確認してください",
      "実行可能な項目から始めてください",
      "必要に応じて営業戦略を調整してください"
    ],
    sales_specific_tips: [
      "営業の目的を明確にする",
      "顧客のニーズを深掘りする",
      "価値提案を最適化する"
    ],
    industry_topics: [
      "業界の最新トレンド",
      "業界特有の課題",
      "業界の成功事例"
    ],
    preparation_timeline: [
      "営業前日までに資料を準備",
      "営業開始1時間前に顧客情報を確認",
      "営業開始30分前に最終準備"
    ]
  };
}

// フォールバック用の営業特化チェックリスト
function generateSalesFallbackChecklist(body: SalesChecklistRequest): ChecklistResponse {
  return {
    checklist: [
      {
        id: "customer_analysis",
        category: "顧客分析",
        question: "顧客のニーズと課題は明確に把握されていますか？",
        description: "顧客の真のニーズを理解することで、適切なソリューションを提案できます。",
        importance: "critical",
        examples: ["顧客インタビューの実施", "課題の深掘り", "ニーズの優先順位付け"],
        reasoning: "顧客ニーズが不明確だと、的外れな提案になり、営業が失敗します。",
        timing: "営業開始前",
        specific_advice: `${body.customer_type}の顧客には、業界特有の課題を重点的に調査しましょう。`
      },
      {
        id: "competitive_analysis",
        category: "競合分析",
        question: "競合他社の状況と自社の差別化ポイントは明確ですか？",
        description: "競合状況を理解することで、効果的な差別化戦略を策定できます。",
        importance: "critical",
        examples: ["競合他社の調査", "差別化ポイントの特定", "価値提案の最適化"],
        reasoning: "競合分析が不十分だと、差別化できず、価格競争に巻き込まれます。",
        timing: "営業開始前",
        specific_advice: `${body.industry}業界では、技術革新とサービス品質が重要な差別化要因です。`
      },
      {
        id: "value_proposition",
        category: "価値提案",
        question: "顧客にとって明確で魅力的な価値提案は準備されていますか？",
        description: "強力な価値提案により、顧客の関心を引き、営業の成功率が向上します。",
        importance: "important",
        examples: ["価値提案の文書化", "顧客メリットの明確化", "証拠・事例の準備"],
        reasoning: "価値提案が弱いと、顧客の関心を引けず、営業が失敗します。",
        timing: "営業開始前",
        specific_advice: `${body.customer_position}レベルの顧客には、経営課題とROIを明確に示しましょう。`
      },
      {
        id: "approach_strategy",
        category: "アプローチ戦略",
        question: "顧客への効果的なアプローチ方法は策定されていますか？",
        description: "適切なアプローチにより、顧客との信頼関係を構築できます。",
        importance: "important",
        examples: ["アプローチ方法の選択", "初回コンタクトの準備", "信頼構築の計画"],
        reasoning: "アプローチが不適切だと、顧客の関心を引けず、営業が失敗します。",
        timing: "営業開始前",
        specific_advice: `${body.company_size}の企業には、規模に応じた柔軟なアプローチが効果的です。`
      },
      {
        id: "closing_preparation",
        category: "クロージング準備",
        question: "クロージングに必要な準備と戦略は整っていますか？",
        description: "適切なクロージング準備により、営業の成功確率が向上します。",
        importance: "recommended",
        examples: ["反対意見への対応準備", "クロージング戦略の策定", "契約条件の調整"],
        reasoning: "クロージング準備が不十分だと、最後の段階で失敗する可能性があります。",
        timing: "営業進行中",
        specific_advice: `${body.sales_stage}では、顧客の意思決定プロセスを理解することが重要です。`
      }
    ],
    summary: `${body.sales_stage}に特化した基本的な準備状況を確認するチェックリストです。`,
    recommendations: [
      "各営業項目を順番に確認してください",
      "営業の目的に応じて項目を調整してください",
      "顧客の状況に応じて優先順位を設定してください",
      "定期的に営業の効果を評価し、チェックリストを更新してください"
    ],
    sales_specific_tips: [
      `${body.sales_stage}では、顧客の準備が成功の鍵です`,
      `${body.industry}業界では、専門知識が重要です`,
      `${body.customer_position}レベルの顧客には、経営視点での提案が効果的です`
    ],
    industry_topics: [
      `${body.industry}業界の最新トレンドと課題`,
      `${body.industry}業界での成功事例とベストプラクティス`,
      `${body.industry}業界の規制とコンプライアンス要件`
    ],
    preparation_timeline: [
      "営業前日までに顧客情報と資料を準備・確認",
      "営業開始1時間前に競合分析と差別化ポイントを確認",
      "営業開始30分前に最終準備と心構えの確認"
    ]
  };
}
