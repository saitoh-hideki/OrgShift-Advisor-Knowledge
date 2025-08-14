// チーム構築・チームビルディング専用のチェックリスト生成Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, type AIContext } from "../_shared/ai-utils.ts"

interface TeamBuildingChecklistRequest {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  team_building_type: string; // 新チーム構築、既存チーム強化、チーム再編成、プロジェクトチーム、部門統合
  team_size: number; // 小規模(2-5人)、中規模(6-15人)、大規模(16+)
  team_maturity: string; // 形成期、混乱期、規範期、実行期、解散期
  team_context: string; // 新規プロジェクト、既存業務改善、組織変革、危機対応、日常業務
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
  specific_advice: string; // チーム構築特有の具体的なアドバイス
}

interface ChecklistResponse {
  checklist: ChecklistItem[];
  summary: string;
  recommendations: string[];
  team_building_specific_tips: string[]; // チーム構築特有のコツ
  team_dynamics_tips: string[]; // チームダイナミクスのコツ
  preparation_timeline: string[]; // 準備のタイムライン
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    const body: TeamBuildingChecklistRequest = await req.json()
    console.log('Team building checklist request received:', body);
    
    // 必須フィールドの検証
    if (!body.scene || !body.goal || !body.time_limit || !body.stakes || !body.team_building_type || !body.team_size || !body.team_maturity || !body.team_context) {
      console.error('Missing required fields:', body);
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: scene, goal, time_limit, stakes, team_building_type, team_size, team_maturity, team_context are required' 
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
      participants: body.team_size,
      relationship: `${body.team_building_type} - ${body.team_maturity}`
    };

    console.log('Processing team building context:', context);

    const prompt = `あなたはチーム構築と組織開発の専門家で、チーム構築・チームビルディングシーンに特化した最適なチェックリストを作成する専門家です。

【チーム構築の詳細分析】
- シーン: ${context.scene} (チーム構築・チームビルディング)
- 目標: ${body.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- チーム構築の種類: ${body.team_building_type}
- チーム規模: ${body.team_size}人
- チームの成熟度: ${body.team_maturity}
- チームの状況: ${body.team_context}
${body.additional_context ? `- 追加コンテキスト: ${body.additional_context}` : ''}

【チーム構築シーン特化のチェックリスト作成要求】
このチーム構築の状況に最適化された、実用的で効果的なチェックリストを作成してください。

【チーム構築特有の構成要素】
各チェックリスト項目には以下を含めてください：

1. **カテゴリ**: チーム分析、目標設定、役割分担、コミュニケーション、信頼構築、成果測定など
2. **質問**: チーム構築特有の具体的で確認しやすい質問
3. **説明**: なぜこの項目がチーム構築の成功に重要なのかの理由
4. **重要度**: critical（必須）、important（重要）、recommended（推奨）
5. **例**: チーム構築特有の具体的な実践例（3-5個）
6. **理由**: この項目がなぜこの重要度なのかの説明
7. **タイミング**: チーム構築のどの段階で確認すべきかの指針
8. **具体的アドバイス**: この項目に関する具体的で実践的なアドバイス

【チーム構築特有の重要度基準】
- **Critical（必須）**: この項目が完了しないとチーム構築の成功が困難
- **Important（重要）**: この項目が完了するとチーム構築の成功率が大幅に向上
- **Recommended（推奨）**: この項目が完了するとチーム構築の品質が向上

【チーム構築種類別特化項目】

**${body.team_building_type}の場合:**
${getTeamBuildingTypeSpecificPrompt(body.team_building_type)}

**チーム規模別の考慮事項:**
${getTeamSizeSpecificPrompt(body.team_size)}

**チーム成熟度別の考慮事項:**
${getTeamMaturitySpecificPrompt(body.team_maturity)}

**チーム状況別の考慮事項:**
${getTeamContextSpecificPrompt(body.team_context)}

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
  "summary": "このチーム構築チェックリストの概要と目的",
  "recommendations": [
    "チーム構築チェックリスト使用時の推奨事項1",
    "チーム構築チェックリスト使用時の推奨事項2",
    "チーム構築チェックリスト使用時の推奨事項3"
  ],
  "team_building_specific_tips": [
    "このチーム構築種類に特化したコツ1",
    "このチーム構築種類に特化したコツ2",
    "このチーム構築種類に特化したコツ3"
  ],
  "team_dynamics_tips": [
    "このチーム成熟度でのダイナミクスコツ1",
    "このチーム成熟度でのダイナミクスコツ2",
    "このチーム成熟度でのダイナミクスコツ3"
  ],
  "preparation_timeline": [
    "チーム構築前の準備タイムライン1",
    "チーム構築前の準備タイムライン2",
    "チーム構築前の準備タイムライン3"
  ]
}

【チーム構築特有の専門的視点】
- チームの成熟度に応じた適切なアプローチの選択
- チーム規模に応じたコミュニケーション方法の最適化
- チームの状況に応じた目標設定と優先順位付け
- メンバーの多様性と強みを活かした役割分担
- 継続的なチーム開発と成長の促進
- チームの成果と個人の成長の両立`

    try {
      console.log('Calling AI for team building checklist...');
      const aiResponse = await generateAIAdvice(prompt, context);
      console.log('AI response received for team building:', aiResponse);
      
      // AIレスポンスからチェックリストを抽出
      const checklistData = extractChecklistFromAIResponse(aiResponse);
      console.log('Extracted team building checklist data:', checklistData);
      
      return new Response(JSON.stringify(checklistData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (error) {
      console.error("AI generation failed for team building:", error);
      // フォールバック用のチーム構築特化チェックリスト
      const fallbackChecklist = generateTeamBuildingFallbackChecklist(body);
      console.log('Using team building fallback checklist:', fallbackChecklist);
      return new Response(JSON.stringify(fallbackChecklist), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  } catch (error) {
    console.error('Team building checklist function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
});

// チーム構築種類別特化プロンプト
function getTeamBuildingTypeSpecificPrompt(teamBuildingType: string): string {
  const typePrompts: Record<string, string> = {
    '新チーム構築': `新チーム構築特有の項目を含めてください：
- チームの目的とビジョンの明確化
- メンバーの選定とスキルマッピング
- チームの基本ルールと規範の設定
- 初回ミーティングとアイスブレイク
- チームの目標と期待値の共有`,

    '既存チーム強化': `既存チーム強化特有の項目を含めてください：
- 現在のチーム状況と課題の分析
- チームの強みと改善点の特定
- メンバーの成長機会と育成計画
- チームプロセスの最適化
- チーム文化の強化と継承`,

    'チーム再編成': `チーム再編成特有の項目を含めてください：
- 再編成の理由と目的の明確化
- 既存メンバーの配置と役割調整
- 新しいチーム構造の設計
- メンバー間の関係性の再構築
- チームの新しい目標と期待値の設定`,

    'プロジェクトチーム': `プロジェクトチーム特有の項目を含めてください：
- プロジェクトの目的とスコープの明確化
- 必要なスキルとリソースの特定
- プロジェクトのタイムラインとマイルストーン
- リスク管理と課題対応の体制
- プロジェクト完了後のチーム解散計画`,

    '部門統合': `部門統合特有の項目を含めてください：
- 統合の目的と期待される効果の明確化
- 各部門の文化とプロセスの理解
- 統合後の組織構造の設計
- メンバーの不安と懸念への対応
- 新しい部門文化の構築`
  };

  return typePrompts[teamBuildingType] || `一般的なチーム構築の項目を含めてください：
- チームの目的と目標の明確化
- メンバーの役割と責任の設定
- コミュニケーション方法の確立
- チームの成果測定と評価
- 継続的な改善と成長`;
}

// チーム規模別特化プロンプト
function getTeamSizeSpecificPrompt(teamSize: number): string {
  if (teamSize <= 5) {
    return `小規模チーム（2-5人）特有の考慮事項：
- 全員が直接コミュニケーションできる環境
- 個別の強みと役割の明確化
- 迅速な意思決定と実行
- メンバー全員のエンゲージメント維持
- 柔軟な役割分担と相互支援`;
  } else if (teamSize <= 15) {
    return `中規模チーム（6-15人）特有の考慮事項：
- サブチームやグループ分けの活用
- コミュニケーションの効率化
- リーダーシップの分散と役割分担
- チーム全体の方向性の統一
- メンバー間の関係性管理`;
  } else {
    return `大規模チーム（16人以上）特有の考慮事項：
- 階層的な組織構造の設計
- 標準化されたプロセスとルール
- 効果的なコミュニケーション体制
- チーム間の調整と連携
- スケーラブルな管理システム`;
  }
}

// チーム成熟度別特化プロンプト
function getTeamMaturitySpecificPrompt(teamMaturity: string): string {
  const maturityPrompts: Record<string, string> = {
    '形成期': `形成期特有の考慮事項：
- チームの目的とビジョンの明確化
- メンバー間の信頼関係の構築
- 基本的なルールと規範の設定
- アイスブレイクとチームビルディング活動
- 期待値と役割の明確化`,

    '混乱期': `混乱期特有の考慮事項：
- 対立と意見の相違への適切な対応
- コミュニケーションの改善と促進
- 合意形成プロセスの確立
- メンバーの不安と懸念への対応
- チームの方向性の再確認`,

    '規範期': `規範期特有の考慮事項：
- チームの規範とルールの確立
- 効率的なプロセスと手順の標準化
- メンバー間の協力と連携の促進
- チームの成果とパフォーマンスの向上
- 継続的な改善の仕組み化`,

    '実行期': `実行期特有の考慮事項：
- 高パフォーマンスチームの維持
- イノベーションと創造性の促進
- メンバーの成長と発展の支援
- チームの成果と成功の継続
- 次世代リーダーの育成`,

    '解散期': `解散期特有の考慮事項：
- チームの成果と学びの振り返り
- メンバーの次のステップの支援
- 知識と経験の文書化と共有
- チームの解散と移行の管理
- 関係性とネットワークの維持`
  };

  return maturityPrompts[teamMaturity] || '- チーム成熟度に応じた適切なアプローチの検討';
}

// チーム状況別特化プロンプト
function getTeamContextSpecificPrompt(teamContext: string): string {
  const contextPrompts: Record<string, string> = {
    '新規プロジェクト': `新規プロジェクト特有の考慮事項：
- プロジェクトの目的とスコープの明確化
- 必要なスキルとリソースの特定
- プロジェクトのタイムラインとマイルストーン
- リスク管理と課題対応の体制
- プロジェクト完了後のチーム解散計画`,

    '既存業務改善': `既存業務改善特有の考慮事項：
- 現在の業務プロセスの分析と課題の特定
- 改善目標とKPIの設定
- メンバーの改善提案とアイデアの活用
- 段階的な改善の実施と効果測定
- 改善の定着と継続的な改善の仕組み化`,

    '組織変革': `組織変革特有の考慮事項：
- 変革の必要性と目的の明確化
- メンバーの抵抗感と不安への対応
- 変革プロセスの段階的な実施
- コミュニケーションと透明性の確保
- 変革の成果と効果の測定`,

    '危機対応': `危機対応特有の考慮事項：
- 危機の状況と影響範囲の迅速な把握
- 緊急時の意思決定プロセスの確立
- チームメンバーの安全と健康の確保
- 効果的なコミュニケーション体制
- 危機からの回復と学習の促進`,

    '日常業務': `日常業務特有の考慮事項：
- 日常業務の効率化と品質向上
- チームメンバーのスキル向上と育成
- チームの士気とエンゲージメントの維持
- 継続的な改善とイノベーションの促進
- チームの長期的な成長と発展`
  };

  return contextPrompts[teamContext] || '- チーム状況に応じた適切なアプローチの検討';
}

// AIレスポンスからチェックリストを抽出
function extractChecklistFromAIResponse(aiResponse: any): ChecklistResponse {
  try {
    console.log('Extracting team building checklist from AI response:', aiResponse);
    
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
    console.log('Failed to extract team building checklist, using fallback');
    throw new Error("Failed to extract team building checklist from AI response");
  } catch (error) {
    console.error("Team building checklist extraction failed:", error);
    throw error;
  }
}

// アドバイスをチェックリスト形式に変換
function convertAdvicesToChecklist(advices: any[]): ChecklistResponse {
  const checklist = advices.map((advice, index) => ({
    id: `team_building_advice_${index}`,
    category: "チーム構築準備・実行",
    question: advice.short_advice || "このチーム構築アドバイスは実行可能ですか？",
    description: advice.expected_effect || "チーム構築の効果的な実行のための確認事項",
    importance: "important" as const,
    examples: [
      "具体的なチーム構築計画を立てる",
      "必要なリソースを準備する",
      "チーム構築のタイミングを決める"
    ],
    reasoning: "このチーム構築アドバイスの効果的な実行のため",
    timing: "チーム構築開始前",
    specific_advice: "チーム構築特有の具体的なアドバイス"
  }));

  return {
    checklist,
    summary: "AI生成されたチーム構築アドバイスをチェックリスト形式に変換しました。",
    recommendations: [
      "各チーム構築項目を順番に確認してください",
      "実行可能な項目から始めてください",
      "必要に応じてチーム構築戦略を調整してください"
    ],
    team_building_specific_tips: [
      "チーム構築の目的を明確にする",
      "メンバーの強みを活かす",
      "継続的な改善を心がける"
    ],
    team_dynamics_tips: [
      "チームの成熟度に応じたアプローチ",
      "効果的なコミュニケーション促進",
      "信頼関係の構築と維持"
    ],
    preparation_timeline: [
      "チーム構築前日までに計画を準備",
      "チーム構築開始1時間前に環境を確認",
      "チーム構築開始30分前に最終準備"
    ]
  };
}

// フォールバック用のチーム構築特化チェックリスト
function generateTeamBuildingFallbackChecklist(body: TeamBuildingChecklistRequest): ChecklistResponse {
  return {
    checklist: [
      {
        id: "team_analysis",
        category: "チーム分析",
        question: "チームの現状と課題は明確に把握されていますか？",
        description: "チームの現状と課題を理解することで、適切なチーム構築戦略を策定できます。",
        importance: "critical",
        examples: ["メンバーのスキル分析", "チームの強みと弱みの特定", "課題の優先順位付け"],
        reasoning: "チームの現状が不明確だと、効果的なチーム構築が困難になります。",
        timing: "チーム構築開始前",
        specific_advice: `${body.team_building_type}では、チームの現状を正確に把握することが成功の鍵です。`
      },
      {
        id: "goal_setting",
        category: "目標設定",
        question: "チームの目標と期待される成果は明確ですか？",
        description: "明確な目標により、チームの方向性が統一され、メンバーのエンゲージメントが向上します。",
        importance: "critical",
        examples: ["チームビジョンの策定", "具体的な目標の設定", "成功指標の明確化"],
        reasoning: "目標が不明確だと、チームの方向性が曖昧になり、成果が低下します。",
        timing: "チーム構築開始前",
        specific_advice: `${body.team_size}人のチームには、全員が理解できる明確な目標設定が重要です。`
      },
      {
        id: "role_assignment",
        category: "役割分担",
        question: "メンバーの役割と責任は適切に設定されていますか？",
        description: "適切な役割分担により、チームの効率性とメンバーの満足度が向上します。",
        importance: "important",
        examples: ["スキルに基づく役割分担", "責任の明確化", "相互支援の体制"],
        reasoning: "役割分担が不適切だと、チームの効率性が低下し、メンバーの不満が増加します。",
        timing: "チーム構築開始前",
        specific_advice: `${body.team_maturity}の段階では、柔軟な役割分担が効果的です。`
      },
      {
        id: "communication_setup",
        category: "コミュニケーション設定",
        question: "効果的なコミュニケーション方法は確立されていますか？",
        description: "適切なコミュニケーションにより、チームの連携と情報共有が向上します。",
        importance: "important",
        examples: ["コミュニケーションツールの選択", "会議の頻度と形式", "情報共有の方法"],
        reasoning: "コミュニケーションが不適切だと、チームの連携が困難になり、成果が低下します。",
        timing: "チーム構築開始前",
        specific_advice: `${body.team_context}では、状況に応じた柔軟なコミュニケーションが重要です。`
      },
      {
        id: "trust_building",
        category: "信頼構築",
        question: "チームメンバー間の信頼関係は構築されていますか？",
        description: "信頼関係により、チームの協力と創造性が向上します。",
        importance: "recommended",
        examples: ["チームビルディング活動", "相互理解の促進", "オープンなコミュニケーション"],
        reasoning: "信頼関係が不十分だと、チームの協力が困難になり、成果が低下します。",
        timing: "チーム構築進行中",
        specific_advice: `${body.team_building_type}では、段階的な信頼構築が効果的です。`
      }
    ],
    summary: `${body.team_building_type}に特化した基本的な準備状況を確認するチェックリストです。`,
    recommendations: [
      "各チーム構築項目を順番に確認してください",
      "チーム構築の目的に応じて項目を調整してください",
      "チームの状況に応じて優先順位を設定してください",
      "定期的にチーム構築の効果を評価し、チェックリストを更新してください"
    ],
    team_building_specific_tips: [
      `${body.team_building_type}では、段階的なアプローチが成功の鍵です`,
      `${body.team_size}人のチームには、全員が参加できる活動が効果的です`,
      `${body.team_maturity}の段階では、適切なサポートが重要です`
    ],
    team_dynamics_tips: [
      `${body.team_maturity}では、チームの成長段階に応じたアプローチが効果的です`,
      `${body.team_context}では、状況に応じた柔軟性が重要です`,
      `${body.team_building_type}では、長期的な視点での計画が重要です`
    ],
    preparation_timeline: [
      "チーム構築前日までに計画と資料を準備・確認",
      "チーム構築開始1時間前に環境と設備を確認",
      "チーム構築開始30分前にメンバーへの最終確認"
    ]
  };
}
