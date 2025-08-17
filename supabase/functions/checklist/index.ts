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
  is_ai_generated: boolean; // AI生成かどうかのフラグを追加
  generation_time_ms?: number; // 生成時間を追加
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
      const startTime = Date.now();
      
      // シーンに応じた専用チェックリスト関数を呼び出し
      console.log(`Routing to specialist checklist for scene: ${body.scene}`);
      const specialistChecklist = await routeToSpecialistChecklist(body.scene, context, body.additional_context);
      const generationTime = Date.now() - startTime;
      
      console.log('Specialist checklist generated successfully:', specialistChecklist);
      console.log('Generation time:', generationTime, 'ms');
      
      // 生成時間とAI生成フラグを追加
      specialistChecklist.generation_time_ms = generationTime;
      specialistChecklist.is_ai_generated = true;
      
      return new Response(JSON.stringify(specialistChecklist), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (error) {
      console.error("Specialist checklist failed:", error);
      
      // 専門関数が失敗した場合は、汎用AIチェックリストを試行
      try {
        console.log("Trying generic AI checklist as fallback...");
        const startTime = Date.now();
        const genericChecklist = await generateGenericChecklist(context, body.additional_context);
        const generationTime = Date.now() - startTime;
        
        console.log('Generic AI checklist generated successfully:', genericChecklist);
        console.log('Generation time:', generationTime, 'ms');
        
        // 生成時間とAI生成フラグを追加
        genericChecklist.generation_time_ms = generationTime;
        genericChecklist.is_ai_generated = true;
        
        return new Response(JSON.stringify(genericChecklist), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (genericError) {
        console.error("Generic AI checklist also failed:", genericError);
        
        // さらに再試行を試みる
        try {
          console.log("Final retry attempt with generic AI...");
          const startTime = Date.now();
          const genericChecklist = await generateGenericChecklist(context, body.additional_context);
          const generationTime = Date.now() - startTime;
          
          console.log('AI checklist generated successfully on final retry:', genericChecklist);
          console.log('Final retry generation time:', generationTime, 'ms');
          
          // 生成時間とAI生成フラグを追加
          genericChecklist.generation_time_ms = generationTime;
          genericChecklist.is_ai_generated = true;
          
          return new Response(JSON.stringify(genericChecklist), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (finalError) {
          console.error("All AI generation attempts failed:", finalError);
          
          // 最後の手段としてフォールバックチェックリストを使用
          console.log("Using fallback checklist as last resort");
          const fallbackChecklist = generateFallbackChecklist(context);
          fallbackChecklist.is_ai_generated = false;
          fallbackChecklist.generation_time_ms = 0;
          
          return new Response(JSON.stringify(fallbackChecklist), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      }
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
    'meeting': `${Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'}/functions/v1/checklist-meeting`,
    'sales': `${Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'}/functions/v1/checklist-sales`,
    'presentation': `${Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'}/functions/v1/checklist-presentation`,
    'interview': `${Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'}/functions/v1/checklist-interview`,
    'team_building': `${Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'}/functions/v1/checklist-team-building`
  };

  const specialistUrl = specialistUrls[scene as keyof typeof specialistUrls];
  
  if (specialistUrl) {
    try {
      console.log(`Routing to specialist checklist: ${scene} at ${specialistUrl}`);
      
      // シーン別の適切なパラメータを構築
      const requestBody = buildSceneSpecificRequestBody(scene, context, additionalContext);
      console.log('Request body for specialist:', requestBody);
      
      const response = await fetch(specialistUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Specialist checklist ${scene} response received:`, data);
        return data;
      } else {
        const errorText = await response.text();
        console.error(`Specialist checklist ${scene} failed with status: ${response.status}, error: ${errorText}`);
        
        // 認証エラー（401）の場合は、汎用AIチェックリストを試行
        if (response.status === 401) {
          console.log(`Authentication failed for ${scene}, trying generic AI checklist`);
          throw new Error('Authentication failed, trying generic AI');
        }
        
        // その他のエラーの場合も汎用AIを試行
        console.log(`Specialist checklist ${scene} failed, trying generic AI as fallback`);
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

// シーン別の適切なリクエストボディを構築
function buildSceneSpecificRequestBody(scene: string, context: AIContext, additionalContext?: string): any {
  const baseBody = {
    scene: context.scene,
    goal: context.goal,
    time_limit: context.timeLimit,
    stakes: context.stakes,
    participants: context.participants,
    relationship: context.relationship,
    additional_context: additionalContext
  };

  // シーン別の追加パラメータ
  switch (scene) {
    case 'meeting':
      return {
        ...baseBody,
        meeting_type: "定例会議",
        participants_count: context.participants || 2,
        participant_roles: context.relationship ? [context.relationship] : ["参加者"],
        meeting_format: "対面"
      };
    
    case 'sales':
      return {
        ...baseBody,
        customer_type: "既存顧客",
        industry: "IT",
        customer_position: "担当者",
        company_size: "中小企業",
        sales_stage: "提案"
      };
    
    case 'presentation':
      return {
        ...baseBody,
        presentation_purpose: "情報共有",
        audience_type: "社内",
        presentation_format: "対面"
      };
    
    case 'interview':
      return {
        ...baseBody,
        interview_type: "1on1",
        interview_purpose: "進捗確認"
      };
    
    case 'team_building':
      return {
        ...baseBody,
        team_building_type: "チーム強化",
        team_maturity: "成長期",
        team_context: "プロジェクト進行中"
      };
    
    default:
      return baseBody;
  }
}

// 汎用AIチェックリスト生成（再試行機能付き）
async function generateGenericChecklist(context: AIContext, additionalContext?: string, retryCount: number = 0): Promise<ChecklistResponse> {
  const maxRetries = 2; // 最大2回まで再試行
  
  try {
    console.log(`Calling AI for generic checklist (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    const prompt = `あなたは組織変革とリーダーシップの専門家で、各シーンに応じた最適なチェックリストを作成する専門家です。

【重要】このプロンプトに対して、必ずJSON形式で回答してください。テキストのみの回答は絶対に受け付けません。

【状況分析】
- シーン: ${context.scene}
- 目標: ${context.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
${context.participants ? `- 参加者数: ${context.participants}人` : ''}
${context.relationship ? `- 関係性: ${context.relationship}` : ''}
${additionalContext ? `- 追加コンテキスト: ${additionalContext}` : ''}

【チェックリスト作成の要求】
この状況に最適化された、実用的で効果的なチェックリストを作成してください。必ず5-8個のチェックリスト項目を含めてください。

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
必ず以下のJSON形式で返してください：
{
  "checklist": [
    {
      "id": "item_1",
      "category": "カテゴリ名",
      "question": "具体的な質問",
      "description": "項目の説明",
      "importance": "critical",
      "examples": ["例1", "例2", "例3"],
      "reasoning": "この重要度である理由",
      "timing": "確認すべきタイミング"
    },
    {
      "id": "item_2",
      "category": "カテゴリ名",
      "question": "具体的な質問",
      "description": "項目の説明",
      "importance": "important",
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
- 成功指標の明確化と測定方法の提示

【最終確認】
必ずJSON形式で回答し、checklist配列に5-8個の項目を含めてください。テキストのみの回答は絶対に受け付けません。`;

    const aiResponse = await generateAIAdvice(prompt, context);
    console.log('AI response received for generic:', aiResponse);
    
    // AIレスポンスからチェックリストを抽出
    const checklistData = extractChecklistFromAIResponse(aiResponse);
    console.log('Extracted generic checklist data:', checklistData);
    
    return checklistData;
  } catch (error) {
    console.error(`AI generation failed for generic (attempt ${retryCount + 1}):`, error);
    
    // 再試行可能な場合は再試行
    if (retryCount < maxRetries) {
      console.log(`Retrying AI generation (${retryCount + 1}/${maxRetries})...`);
      // 少し待ってから再試行
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return generateGenericChecklist(context, additionalContext, retryCount + 1);
    }
    
    // 最大再試行回数に達した場合はエラーを投げる
    throw new Error(`AI generation failed after ${maxRetries + 1} attempts: ${error.message}`);
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
    console.log('AI response type:', typeof aiResponse);
    console.log('AI response keys:', aiResponse ? Object.keys(aiResponse) : 'null/undefined');
    
    if (aiResponse) {
      // 直接チェックリストが含まれている場合
      if (aiResponse.checklist && Array.isArray(aiResponse.checklist)) {
        console.log('Found checklist in response, items count:', aiResponse.checklist.length);
        
        // チェックリストの品質を検証
        if (aiResponse.checklist.length >= 3) {
          console.log('Checklist quality verified, returning response');
          return aiResponse;
        } else {
          console.warn('Checklist too short, attempting to enhance...');
          // 短すぎる場合は拡張を試みる
          const enhancedChecklist = enhanceChecklist(aiResponse.checklist);
          return {
            ...aiResponse,
            checklist: enhancedChecklist
          };
        }
      }
      
      // アドバイスが含まれている場合
      if (aiResponse.advices && Array.isArray(aiResponse.advices)) {
        console.log('Found advices, converting to checklist format, count:', aiResponse.advices.length);
        return convertAdvicesToChecklist(aiResponse.advices);
      }
      
      // 配列の場合、最初の要素を確認
      if (Array.isArray(aiResponse) && aiResponse.length > 0) {
        const firstResponse = aiResponse[0];
        console.log('First response:', firstResponse);
        
        if (firstResponse.checklist && Array.isArray(firstResponse.checklist)) {
          console.log('Found checklist in first response, items count:', firstResponse.checklist.length);
          return firstResponse;
        }
        
        if (firstResponse.advices && Array.isArray(firstResponse.advices)) {
          console.log('Found advices in first response, converting to checklist format');
          return convertAdvicesToChecklist(firstResponse.advices);
        }
      }
      
      // レスポンスの内容を詳しく確認
      console.log('Response content analysis:');
      console.log('- Has checklist:', !!aiResponse.checklist);
      console.log('- Has advices:', !!aiResponse.advices);
      console.log('- Response structure:', JSON.stringify(aiResponse, null, 2).substring(0, 500));
    }
    
    // フォールバック
    console.log('Failed to extract checklist, using fallback');
    throw new Error("Failed to extract checklist from AI response");
  } catch (error) {
    console.error("Checklist extraction failed:", error);
    throw error;
  }
}

// チェックリストを拡張する関数
function enhanceChecklist(checklist: any[]): any[] {
  console.log('Enhancing checklist with additional items...');
  
  const enhancedItems = [...checklist];
  
  // 基本的な項目を追加
  const basicItems = [
    {
      id: "enhanced_preparation",
      category: "基本準備",
      question: "目的と目標は明確に設定されていますか？",
      description: "シーンの目的と期待される成果を明確にすることで、効果的な実行が可能になります。",
      importance: "critical" as const,
      examples: ["目標を具体的に設定", "成功指標を明確化", "期待される成果を定義"],
      reasoning: "目的が不明確だと、効果的な実行が困難になります。",
      timing: "シーン開始前"
    },
    {
      id: "enhanced_execution",
      category: "実行・進行",
      question: "計画通りに実行できていますか？",
      description: "計画を確実に実行することで、期待される成果を達成できます。",
      importance: "important" as const,
      examples: ["計画の進捗確認", "必要に応じた調整", "実行の記録"],
      reasoning: "計画の実行が不十分だと、成果が期待通りに得られません。",
      timing: "シーン進行中"
    }
  ];
  
  // 重複を避けて追加
  basicItems.forEach(item => {
    if (!enhancedItems.find(existing => existing.question === item.question)) {
      enhancedItems.push(item);
    }
  });
  
  console.log('Enhanced checklist items count:', enhancedItems.length);
  return enhancedItems;
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
    ],
    is_ai_generated: true
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
    ],
    is_ai_generated: false
  };
}
