// 状況に応じた最適なチェックリストを生成するEdge Function（ルーター）
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, type AIContext } from "../_shared/ai-utils.ts"
import { adminClient, diagnoseEnvironment } from "../_shared/client.ts"

interface ChecklistRequest {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
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
}

interface ChecklistResponse {
  checklist: ChecklistItem[];
  summary: string;
  recommendations: string[];
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    console.log('Checklist function called with method:', req.method);
    console.log('Request URL:', req.url);
    
    // 環境変数の診断
    const envDiagnosis = diagnoseEnvironment();
    console.log('Environment diagnosis:', envDiagnosis);
    
    if (!envDiagnosis.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using fallback checklist');
    }
    
    const body: ChecklistRequest = await req.json()
    console.log('Checklist request received:', body);
    
    // 必須フィールドの検証
    if (!body.scene || !body.goal || !body.time_limit || !body.stakes) {
      console.error('Missing required fields:', body);
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: scene, goal, time_limit, stakes are required' 
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
      participants: body.participants,
      relationship: body.relationship
    };

    console.log('Processing context:', context);

    // シーン別の専門チェックリスト関数にルーティング
    try {
      const checklistData = await routeToSpecialistChecklist(body.scene, context, body.additional_context);
      console.log('Specialist checklist generated:', checklistData);
      
      return new Response(JSON.stringify(checklistData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (error) {
      console.error("Specialist checklist failed:", error);
      
      // 専門関数が失敗した場合は、直接フォールバックチェックリストを使用
      console.log("Using fallback checklist due to specialist failure");
      const fallbackChecklist = generateFallbackChecklist(context);
      
      return new Response(JSON.stringify(fallbackChecklist), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
});

// シーン別の専門チェックリスト関数にルーティング
async function routeToSpecialistChecklist(scene: string, context: AIContext, additionalContext?: string): Promise<ChecklistResponse> {
  const specialistUrls = {
    'meeting': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/checklist-meeting',
    'sales': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/checklist-sales',
    'presentation': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/checklist-presentation',
    'interview': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/checklist-interview',
    'team_building': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/checklist-team-building'
  };

  const specialistUrl = specialistUrls[scene as keyof typeof specialistUrls];
  
  if (specialistUrl) {
    try {
      console.log(`Routing to specialist checklist: ${scene}`);
      // 環境変数から直接認証情報を取得
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseServiceRoleKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
      }
      
      const response = await fetch(specialistUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scene: context.scene,
          goal: context.goal,
          time_limit: context.timeLimit,
          stakes: context.stakes,
          participants: context.participants,
          relationship: context.relationship,
          additional_context: additionalContext,
          // シーン別関数で必要な追加フィールド
          meeting_type: "定例会議", // デフォルト値
          participants_count: context.participants || 2,
          participant_roles: context.relationship ? [context.relationship] : ["参加者"],
          meeting_format: "対面", // デフォルト値
          // 他のシーン用のフィールドも追加
          customer_type: "既存顧客",
          industry: "IT",
          customer_position: "担当者",
          company_size: "中小企業",
          sales_stage: "提案",
          presentation_purpose: "情報共有",
          audience_type: "社内",
          presentation_format: "対面",
          interview_type: "1on1",
          interview_purpose: "進捗確認",
          team_building_type: "チーム強化",
          team_maturity: "成長期",
          team_context: "プロジェクト進行中"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error(`Specialist checklist ${scene} failed with status:`, response.status);
        
        // 認証エラー（401）の場合は、フォールバックチェックリストを使用
        if (response.status === 401) {
          console.log(`Authentication failed for ${scene}, using fallback checklist`);
          throw new Error('Authentication failed, using fallback');
        }
        
        throw new Error(`Specialist checklist failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Specialist checklist ${scene} failed:`, error);
      throw error;
    }
  }
  
  // 専門関数が見つからない場合は汎用AIを使用
  console.log(`No specialist checklist found for scene: ${scene}, using generic`);
  throw new Error(`No specialist checklist available for scene: ${scene}`);
}

// 汎用AIチェックリスト生成
async function generateGenericChecklist(context: AIContext, additionalContext?: string): Promise<ChecklistResponse> {
  const prompt = `あなたは組織変革とリーダーシップの専門家で、各シーンに応じた最適なチェックリストを作成する専門家です。

【状況分析】
- シーン: ${context.scene}
- 目標: ${context.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
${context.participants ? `- 参加者数: ${context.participants}人` : ''}
${context.relationship ? `- 関係性: ${context.relationship}` : ''}
${additionalContext ? `- 追加コンテキスト: ${additionalContext}` : ''}

【チェックリスト作成の要求】
この状況に最適化された、実用的で効果的なチェックリストを作成してください。

【チェックリストの構成要素】
各チェックリスト項目には以下を含めてください：

1. **カテゴリ**: 準備、実行、フォローアップ、リスク管理など
2. **質問**: 具体的で確認しやすい質問
3. **説明**: なぜこの項目が重要なのかの理由
4. **重要度**: critical（必須）、important（重要）、recommended（推奨）
5. **例**: 具体的な実践例（3-5個）
6. **理由**: この項目がなぜこの重要度なのかの説明
7. **タイミング**: いつ確認すべきかの指針

【重要度の基準】
- **Critical（必須）**: この項目が完了しないと成功が困難
- **Important（重要）**: この項目が完了すると成功率が大幅に向上
- **Recommended（推奨）**: この項目が完了すると品質が向上

【シーン別の専門性】
${getSceneSpecificPrompt(context.scene)}

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
      "timing": "確認すべきタイミング"
    }
  ],
  "summary": "このチェックリストの概要と目的",
  "recommendations": [
    "チェックリスト使用時の推奨事項1",
    "チェックリスト使用時の推奨事項2",
    "チェックリスト使用時の推奨事項3"
  ]
}

【専門的な視点】
- 状況の緊急性と重要度を考慮した優先順位付け
- 参加者数や関係性に応じた項目の調整
- 時間制限に応じた実行可能性の考慮
- リスク要因の特定と対策の提案
- 成功指標の明確化と測定方法の提示`

  try {
    console.log('Calling AI for generic checklist...');
    const aiResponse = await generateAIAdvice(prompt, context);
    console.log('AI response received for generic:', aiResponse);
    
    // AIレスポンスからチェックリストを抽出
    const checklistData = extractChecklistFromAIResponse(aiResponse);
    console.log('Extracted generic checklist data:', checklistData);
    
    return checklistData;
  } catch (error) {
    console.error("AI generation failed for generic:", error);
    // フォールバック用の基本チェックリスト
    const fallbackChecklist = generateFallbackChecklist(context);
    console.log('Using generic fallback checklist:', fallbackChecklist);
    return fallbackChecklist;
  }
}

// シーン別の専門的なプロンプトを生成
function getSceneSpecificPrompt(scene: string): string {
  const scenePrompts: Record<string, string> = {
    'meeting': `会議・ミーティングシーンに特化した項目を含めてください：
- アジェンダ設計と共有
- 参加者の準備状況
- 時間管理と進行
- 意思決定プロセス
- アクションアイテムの明確化`,

    'sales': `営業・商談シーンに特化した項目を含めてください：
- 顧客ニーズの深掘り
- 競合分析と差別化
- 価値提案の最適化
- 反対意見への対応準備
- クロージング戦略`,

    'presentation': `プレゼンテーションシーンに特化した項目を含めてください：
- 聴衆分析とニーズ把握
- メッセージ設計と構成
- 視覚的資料の効果
- デリバリー技術
- 聴衆エンゲージメント`,

    'interview': `面談シーンに特化した項目を含めてください：
- 面談の目的と目標の明確化
- 環境設定とプライバシーの確保
- 効果的なコミュニケーション方法
- フィードバックとフォローアップ
- 関係性の構築と維持`,

    'team_building': `チーム構築・チームビルディングシーンに特化した項目を含めてください：
- チームの目的とビジョンの明確化
- メンバーの役割と責任の設定
- コミュニケーション方法の確立
- 信頼関係の構築と維持
- チームの成果測定と評価`
  };

  return scenePrompts[scene] || `一般的なビジネスシーンに特化した項目を含めてください：
- 目的と目標の明確化
- 関係者の理解と調整
- リスク要因の特定
- 成功指標の設定
- フォローアップ計画`;
}

// AIレスポンスからチェックリストを抽出
function extractChecklistFromAIResponse(aiResponse: any): ChecklistResponse {
  try {
    console.log('Extracting checklist from AI response:', aiResponse);
    
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
    console.log('Failed to extract checklist, using fallback');
    throw new Error("Failed to extract checklist from AI response");
  } catch (error) {
    console.error("Checklist extraction failed:", error);
    throw error;
  }
}

// アドバイスをチェックリスト形式に変換
function convertAdvicesToChecklist(advices: any[]): ChecklistResponse {
  const checklist = advices.map((advice, index) => ({
    id: `advice_${index}`,
    category: "準備・実行",
    question: advice.short_advice || "このアドバイスは実行可能ですか？",
    description: advice.expected_effect || "効果的な実行のための確認事項",
    importance: "important" as const,
    examples: [
      "具体的な行動計画を立てる",
      "必要なリソースを準備する",
      "実行のタイミングを決める"
    ],
    reasoning: "このアドバイスの効果的な実行のため",
    timing: "シーン開始前"
  }));

  return {
    checklist,
    summary: "AI生成されたアドバイスをチェックリスト形式に変換しました。",
    recommendations: [
      "各アドバイスを順番に確認してください",
      "実行可能な項目から始めてください",
      "必要に応じて調整を行ってください"
    ]
  };
}

// フォールバック用の基本チェックリスト
function generateFallbackChecklist(context: AIContext): ChecklistResponse {
  return {
    checklist: [
      {
        id: "basic_preparation",
        category: "基本準備",
        question: "目的と目標は明確に設定されていますか？",
        description: "シーンの目的と期待される成果を明確にすることで、効果的な実行が可能になります。",
        importance: "critical",
        examples: ["目標を具体的に設定", "成功指標を明確化", "期待される成果を定義"],
        reasoning: "目的が不明確だと、効果的な実行が困難になります。",
        timing: "シーン開始前"
      },
      {
        id: "stakeholder_understanding",
        category: "関係者理解",
        question: "関係者の立場と関心事は理解されていますか？",
        description: "関係者の立場と関心事を理解することで、適切なアプローチが可能になります。",
        importance: "critical",
        examples: ["関係者の背景を調査", "関心事を特定", "立場を理解"],
        reasoning: "関係者の理解がないと、適切な対応が困難になります。",
        timing: "シーン開始前"
      },
      {
        id: "resource_preparation",
        category: "リソース準備",
        question: "必要なリソースは準備されていますか？",
        description: "必要なリソースを事前に準備することで、スムーズな実行が可能になります。",
        importance: "important",
        examples: ["必要な資料の準備", "ツールの確認", "時間の確保"],
        reasoning: "リソースが不足していると、実行の質が低下する可能性があります。",
        timing: "シーン開始前"
      }
    ],
    summary: "基本的な準備状況を確認するチェックリストです。",
    recommendations: [
      "各項目を順番に確認してください",
      "完了できない項目がある場合は、代替案を検討してください",
      "定期的にチェックリストを見直し、更新してください"
    ]
  };
}
