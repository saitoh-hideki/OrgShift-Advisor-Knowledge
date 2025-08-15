// プレゼンテーション専用のチェックリスト生成Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, type AIContext } from "../_shared/ai-utils.ts"

interface PresentationChecklistRequest {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  presentation_purpose: string; // 提案、報告、教育、説得、紹介
  audience_type: string; // 社内、顧客、投資家、パートナー、一般
  audience_count: number; // 少人数(1-5)、中規模(6-20)、大規模(21+)
  presentation_format: string; // 対面、オンライン、ハイブリッド
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
  specific_advice: string; // プレゼンテーション特有の具体的なアドバイス
}

interface ChecklistResponse {
  checklist: ChecklistItem[];
  summary: string;
  recommendations: string[];
  presentation_specific_tips: string[]; // プレゼンテーション特有のコツ
  audience_engagement_tips: string[]; // 聴衆エンゲージメントのコツ
  preparation_timeline: string[]; // 準備のタイムライン
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    // 環境変数の確認
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    console.log('Environment variables check:', {
      openaiKey: openaiKey ? 'set' : 'missing'
    });
    
    const body: PresentationChecklistRequest = await req.json()
    console.log('Presentation checklist request received:', body);
    
    // 必須フィールドの検証
    if (!body.scene || !body.goal || !body.time_limit || !body.stakes || !body.presentation_purpose || !body.audience_type || !body.audience_count || !body.presentation_format) {
      console.error('Missing required fields:', body);
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: scene, goal, time_limit, stakes, presentation_purpose, audience_type, audience_count, presentation_format are required' 
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
      participants: body.audience_count,
      relationship: `${body.audience_type} - ${body.presentation_purpose}`
    };

    console.log('Processing presentation context:', context);

    const prompt = `あなたはプレゼンテーションとコミュニケーションの専門家で、プレゼンテーションシーンに特化した最適なチェックリストを作成する専門家です。

【プレゼンテーションの詳細分析】
- シーン: ${context.scene} (プレゼンテーション)
- 目標: ${body.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- プレゼンテーションの目的: ${body.presentation_purpose}
- 聴衆タイプ: ${body.audience_type}
- 聴衆数: ${body.audience_count}人
- プレゼンテーション形式: ${body.presentation_format}
${body.additional_context ? `- 追加コンテキスト: ${body.additional_context}` : ''}

【プレゼンテーションシーン特化のチェックリスト作成要求】
このプレゼンテーションの状況に最適化された、実用的で効果的なチェックリストを作成してください。

【プレゼンテーション特有の構成要素】
各チェックリスト項目には以下を含めてください：

1. **カテゴリ**: 聴衆分析、内容設計、資料準備、デリバリー練習、環境確認など
2. **質問**: プレゼンテーション特有の具体的で確認しやすい質問
3. **説明**: なぜこの項目がプレゼンテーションの成功に重要なのかの理由
4. **重要度**: critical（必須）、important（重要）、recommended（推奨）
5. **例**: プレゼンテーション特有の具体的な実践例（3-5個）
6. **理由**: この項目がなぜこの重要度なのかの説明
7. **タイミング**: プレゼンテーションのどの段階で確認すべきかの指針
8. **具体的アドバイス**: この項目に関する具体的で実践的なアドバイス

【プレゼンテーション特有の重要度基準】
- **Critical（必須）**: この項目が完了しないとプレゼンテーションの成功が困難
- **Important（重要）**: この項目が完了するとプレゼンテーションの成功率が大幅に向上
- **Recommended（推奨）**: この項目が完了するとプレゼンテーションの品質が向上

【プレゼンテーション目的別特化項目】

**${body.presentation_purpose}の場合:**
${getPresentationPurposeSpecificPrompt(body.presentation_purpose)}

**聴衆タイプ別の考慮事項:**
${getAudienceTypeSpecificPrompt(body.audience_type)}

**聴衆数別の考慮事項:**
${getAudienceCountSpecificPrompt(body.audience_count)}

**プレゼンテーション形式別の考慮事項:**
${getPresentationFormatSpecificPrompt(body.presentation_format)}

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
  "summary": "このプレゼンテーションチェックリストの概要と目的",
  "recommendations": [
    "プレゼンテーションチェックリスト使用時の推奨事項1",
    "プレゼンテーションチェックリスト使用時の推奨事項2",
    "プレゼンテーションチェックリスト使用時の推奨事項3"
  ],
  "presentation_specific_tips": [
    "このプレゼンテーション目的に特化したコツ1",
    "このプレゼンテーション目的に特化したコツ2",
    "このプレゼンテーション目的に特化したコツ3"
  ],
  "audience_engagement_tips": [
    "この聴衆タイプへのエンゲージメントコツ1",
    "この聴衆タイプへのエンゲージメントコツ2",
    "この聴衆タイプへのエンゲージメントコツ3"
  ],
  "preparation_timeline": [
    "プレゼンテーション前の準備タイムライン1",
    "プレゼンテーション前の準備タイムライン2",
    "プレゼンテーション前の準備タイムライン3"
  ]
}

【プレゼンテーション特有の専門的視点】
- 聴衆の関心と理解度に応じた内容の調整
- 時間制限に応じた情報の優先順位付け
- 聴衆の立場と関心事を考慮したアプローチ
- プレゼンテーションの目的に応じた構成の選択
- 聴衆のエンゲージメントと反応の管理
- 視覚資料とデリバリー技術の最適化`

    try {
      console.log('Calling AI for presentation checklist...');
      const aiResponse = await generateAIAdvice(prompt, context);
      console.log('AI response received for presentation:', aiResponse);
      
      // AIレスポンスからチェックリストを抽出
      const checklistData = extractChecklistFromAIResponse(aiResponse);
      console.log('Extracted presentation checklist data:', checklistData);
      
      return new Response(JSON.stringify(checklistData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (error) {
      console.error("AI generation failed for presentation:", error);
      // フォールバック用のプレゼンテーション特化チェックリスト
      const fallbackChecklist = generatePresentationFallbackChecklist(body);
      console.log('Using presentation fallback checklist:', fallbackChecklist);
      return new Response(JSON.stringify(fallbackChecklist), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  } catch (error) {
    console.error('Presentation checklist function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
});

// プレゼンテーション目的別特化プロンプト
function getPresentationPurposeSpecificPrompt(presentationPurpose: string): string {
  const purposePrompts: Record<string, string> = {
    '提案': `提案プレゼンテーション特有の項目を含めてください：
- 問題の明確化と解決策の提示
- 提案の価値とメリットの明確化
- 実現可能性とリスクの説明
- 投資対効果とROIの提示
- 次のステップとアクションアイテムの設定`,

    '報告': `報告プレゼンテーション特有の項目を含めてください：
- 報告内容の構成と時間配分
- 重要なポイントと結論の明確化
- データと証拠の効果的な提示
- 聴衆の関心と理解度の確認
- 質疑応答への準備と対応方法`,

    '教育': `教育プレゼンテーション特有の項目を含めてください：
- 学習目標と期待される成果の明確化
- 聴衆の知識レベルに応じた内容調整
- 具体的な例と実践的な説明
- 聴衆の理解度確認とフィードバック
- 学習効果の測定と評価方法`,

    '説得': `説得プレゼンテーション特有の項目を含めてください：
- 聴衆の関心事と反対意見の把握
- 論理的な構成と証拠の提示
- 感情的な訴求とストーリーテリング
- 反対意見への対応準備
- 行動を促す明確なメッセージ`,

    '紹介': `紹介プレゼンテーション特有の項目を含めてください：
- 紹介対象の特徴と価値の明確化
- 聴衆の関心を引く導入方法
- 記憶に残る印象的な説明
- 聴衆との関係性構築の機会
- フォローアップと継続的な関係性`
  };

  return purposePrompts[presentationPurpose] || `一般的なプレゼンテーションの項目を含めてください：
- 目的と目標の明確化
- 聴衆の関心事の把握
- 内容の構成と構成
- 効果的なデリバリー方法
- 聴衆の反応とフィードバック`;
}

// 聴衆タイプ別特化プロンプト
function getAudienceTypeSpecificPrompt(audienceType: string): string {
  const audienceTypePrompts: Record<string, string> = {
    '社内': `社内聴衆特有の考慮事項：
- 社内の文化と価値観の理解
- 部門間の利害関係と調整
- 社内用語と略語の適切な使用
- 上司と部下の立場の配慮
- 社内の課題と改善点の共有`,

    '顧客': `顧客聴衆特有の考慮事項：
- 顧客の業界と課題の理解
- 顧客のニーズと期待値の把握
- 競合他社との差別化ポイント
- 顧客の成功事例と価値の可視化
- 長期的な関係性構築の視点`,

    '投資家': `投資家聴衆特有の考慮事項：
- 投資対効果とROIの明確化
- リスク要因と対策の説明
- 市場機会と成長可能性の提示
- 財務データと予測の信頼性
- 競合優位性と持続可能性`,

    'パートナー': `パートナー聴衆特有の考慮事項：
- パートナーシップの価値とメリット
- 相互利益とWin-Winの関係
- 連携体制と責任分担の明確化
- 長期的な関係性の構築
- 共同での成功事例の共有`,

    '一般': `一般聴衆特有の考慮事項：
- 専門用語の分かりやすい説明
- 日常生活との関連性の提示
- 関心を引く導入とストーリーテリング
- 視覚的で分かりやすい資料
- 聴衆の参加とインタラクション`
  };

  return audienceTypePrompts[audienceType] || '- 聴衆タイプに応じた適切なアプローチの検討';
}

// 聴衪数別特化プロンプト
function getAudienceCountSpecificPrompt(audienceCount: number): string {
  if (audienceCount <= 5) {
    return `少人数聴衆（1-5人）特有の考慮事項：
- 個別の関心事とニーズの把握
- 双方向のコミュニケーション促進
- 詳細な説明と深掘りした議論
- 聴衆一人一人への配慮
- 柔軟な内容調整と対応`;
  } else if (audienceCount <= 20) {
    return `中規模聴衆（6-20人）特有の考慮事項：
- グループ分けとブレークアウトセッション
- 聴衆の多様性と関心事の調整
- 時間管理と発言機会の確保
- 視覚資料の効果的な活用
- 聴衆のエンゲージメント維持`;
  } else {
    return `大規模聴衆（21人以上）特有の考慮事項：
- 明確で分かりやすいメッセージ
- 視覚的で印象的な資料
- 聴衆の関心維持のための工夫
- 質疑応答の効率的な管理
- フォローアップと継続的な関係性`;
  }
}

// プレゼンテーション形式別特化プロンプト
function getPresentationFormatSpecificPrompt(presentationFormat: string): string {
  const formatPrompts: Record<string, string> = {
    '対面': `対面プレゼンテーション特有の考慮事項：
- 会場の準備と設備の確認
- 聴衆との距離感とアイコンタクト
- 非言語コミュニケーションの活用
- 会場の環境（照明、音響、温度）の調整
- 聴衆の反応とフィードバックの確認`,

    'オンライン': `オンラインプレゼンテーション特有の考慮事項：
- 技術的な準備と接続テスト
- 画面共有と資料の事前アップロード
- 聴衆の音声・映像設定の確認
- チャット機能と投票機能の活用
- 聴衆の集中力維持のための工夫`,

    'ハイブリッド': `ハイブリッドプレゼンテーション特有の考慮事項：
- 対面・オンライン聴衆の公平な参加機会
- 技術的な統合と音声・映像の調整
- 両方の聴衆にとって分かりやすい進行
- 資料の共有とアクセシビリティの確保
- 聴衆全員のエンゲージメント維持`
  };

  return formatPrompts[presentationFormat] || '- プレゼンテーション形式に応じた適切な準備と進行方法の検討';
}

// AIレスポンスからチェックリストを抽出
function extractChecklistFromAIResponse(aiResponse: any): ChecklistResponse {
  try {
    console.log('Extracting presentation checklist from AI response:', aiResponse);
    
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
    console.log('Failed to extract presentation checklist, using fallback');
    throw new Error("Failed to extract presentation checklist from AI response");
  } catch (error) {
    console.error("Presentation checklist extraction failed:", error);
    throw error;
  }
}

// アドバイスをチェックリスト形式に変換
function convertAdvicesToChecklist(advices: any[]): ChecklistResponse {
  const checklist = advices.map((advice, index) => ({
    id: `presentation_advice_${index}`,
    category: "プレゼンテーション準備・実行",
    question: advice.short_advice || "このプレゼンテーションアドバイスは実行可能ですか？",
    description: advice.expected_effect || "プレゼンテーションの効果的な実行のための確認事項",
    importance: "important" as const,
    examples: [
      "具体的なプレゼンテーション計画を立てる",
      "必要な資料を準備する",
      "プレゼンテーションのタイミングを決める"
    ],
    reasoning: "このプレゼンテーションアドバイスの効果的な実行のため",
    timing: "プレゼンテーション開始前",
    specific_advice: "プレゼンテーション特有の具体的なアドバイス"
  }));

  return {
    checklist,
    summary: "AI生成されたプレゼンテーションアドバイスをチェックリスト形式に変換しました。",
    recommendations: [
      "各プレゼンテーション項目を順番に確認してください",
      "実行可能な項目から始めてください",
      "必要に応じてプレゼンテーション戦略を調整してください"
    ],
    presentation_specific_tips: [
      "プレゼンテーションの目的を明確にする",
      "聴衆の関心事を把握する",
      "効果的なデリバリーを心がける"
    ],
    audience_engagement_tips: [
      "聴衆とのアイコンタクトを保つ",
      "質問を投げかけて参加を促す",
      "聴衆の反応を確認する"
    ],
    preparation_timeline: [
      "プレゼンテーション前日までに資料を準備",
      "プレゼンテーション開始1時間前に会場を確認",
      "プレゼンテーション開始30分前に最終準備"
    ]
  };
}

// フォールバック用のプレゼンテーション特化チェックリスト
function generatePresentationFallbackChecklist(body: PresentationChecklistRequest): ChecklistResponse {
  return {
    checklist: [
      {
        id: "audience_analysis",
        category: "聴衆分析",
        question: "聴衆の関心事と理解度は把握されていますか？",
        description: "聴衆の関心事と理解度を理解することで、適切な内容とレベルでプレゼンテーションできます。",
        importance: "critical",
        examples: ["聴衆の背景調査", "関心事の特定", "知識レベルの確認"],
        reasoning: "聴衆の理解がないと、内容が伝わらず、プレゼンテーションが失敗します。",
        timing: "プレゼンテーション開始前",
        specific_advice: `${body.audience_type}の聴衆には、業界特有の課題と解決策を重点的に説明しましょう。`
      },
      {
        id: "content_structure",
        category: "内容構成",
        question: "プレゼンテーションの構成と流れは明確ですか？",
        description: "明確な構成により、聴衆の理解が向上し、メッセージが効果的に伝わります。",
        importance: "critical",
        examples: ["導入・本論・結論の構成", "時間配分の設定", "重要なポイントの明確化"],
        reasoning: "構成が不明確だと、聴衆が内容を理解できず、プレゼンテーションの効果が低下します。",
        timing: "プレゼンテーション開始前",
        specific_advice: `${body.presentation_purpose}では、目的に応じた論理的な構成が重要です。`
      },
      {
        id: "visual_materials",
        category: "視覚資料",
        question: "視覚資料は効果的で分かりやすく準備されていますか？",
        description: "効果的な視覚資料により、聴衆の理解と関心が向上します。",
        importance: "important",
        examples: ["スライドの作成", "図表の活用", "デザインの統一"],
        reasoning: "視覚資料が不適切だと、聴衆の理解が困難になり、プレゼンテーションの効果が低下します。",
        timing: "プレゼンテーション開始前",
        specific_advice: `${body.audience_count}人の聴衆には、見やすく分かりやすい資料が効果的です。`
      },
      {
        id: "delivery_practice",
        category: "デリバリー練習",
        question: "プレゼンテーションの練習は十分に行われていますか？",
        description: "十分な練習により、自信を持ってプレゼンテーションを実行できます。",
        importance: "important",
        examples: ["内容の暗記", "時間配分の確認", "質疑応答の練習"],
        reasoning: "練習が不十分だと、本番で緊張し、プレゼンテーションの質が低下します。",
        timing: "プレゼンテーション開始前",
        specific_advice: `${body.presentation_format}形式では、技術的な準備と練習が特に重要です。`
      },
      {
        id: "environment_check",
        category: "環境確認",
        question: "プレゼンテーション環境は適切に準備されていますか？",
        description: "適切な環境により、プレゼンテーションがスムーズに進行できます。",
        importance: "recommended",
        examples: ["会場・設備の確認", "技術的なテスト", "バックアップ計画"],
        reasoning: "環境が不適切だと、プレゼンテーションが中断し、聴衆の関心が低下します。",
        timing: "プレゼンテーション開始前",
        specific_advice: `${body.presentation_format}では、事前の技術テストが成功の鍵です。`
      }
    ],
    summary: `${body.presentation_purpose}に特化した基本的な準備状況を確認するチェックリストです。`,
    recommendations: [
      "各プレゼンテーション項目を順番に確認してください",
      "プレゼンテーションの目的に応じて項目を調整してください",
      "聴衆の状況に応じて優先順位を設定してください",
      "定期的にプレゼンテーションの効果を評価し、チェックリストを更新してください"
    ],
    presentation_specific_tips: [
      `${body.presentation_purpose}では、目的の明確化が成功の鍵です`,
      `${body.audience_count}人の聴衆には、全員が理解できる内容を心がけましょう`,
      `${body.presentation_format}形式では、技術的な準備が重要です`
    ],
    audience_engagement_tips: [
      `${body.audience_type}の聴衆には、関心事に焦点を当てた説明が効果的です`,
      `${body.audience_count}人の聴衪には、個別の関心事への配慮が重要です`,
      `${body.presentation_format}では、聴衪とのインタラクションを工夫しましょう`
    ],
    preparation_timeline: [
      "プレゼンテーション前日までに内容と資料を準備・確認",
      "プレゼンテーション開始1時間前に会場・環境を確認",
      "プレゼンテーション開始30分前に最終準備と心構えの確認"
    ]
  };
}
