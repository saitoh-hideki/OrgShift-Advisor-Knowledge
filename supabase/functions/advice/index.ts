// POST: { scene, goal, participants, relationship, time_limit, stakes, [scene-specific details] }
// res : { session_id, advices:[{theory_id, short_advice, expected_effect, caution, tips, related_theory, implementation_steps, success_indicators, common_mistakes}] }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient } from "../_shared/client.ts"

type Payload = {
  scene: string; 
  goal?: string; 
  participants?: number;
  relationship?: string; 
  time_limit?: "short"|"medium"|"long";
  stakes?: "low"|"medium"|"high";
  
  // 会議・ミーティング用の詳細設定
  meeting_type?: string;
  meeting_format?: string;
  meeting_urgency?: string;
  meeting_frequency?: string;
  meeting_participants?: string;
  meeting_tools?: string;
  meeting_challenges?: string;
  
  // 営業・商談用の詳細設定
  customer_type?: string;
  industry?: string;
  customer_position?: string;
  company_size?: string;
  sales_stage?: string;
  deal_size?: string;
  competition_level?: string;
  customer_pain_points?: string;
  
  // プレゼンテーション用の詳細設定
  presentation_purpose?: string;
  audience_type?: string;
  presentation_format?: string;
  presentation_topics?: string;
  audience_expertise?: string;
  presentation_constraints?: string;
  
  // 面談用の詳細設定
  interview_type?: string;
  interview_purpose?: string;
  interview_relationship?: string;
  interview_context?: string;
  interview_outcomes?: string;
  
  // チーム構築用の詳細設定
  team_building_type?: string;
  team_maturity?: string;
  team_context?: string;
  team_size?: string;
  team_diversity?: string;
  team_challenges?: string;
}

// シーン別の専門アドバイザーにルーティング
async function routeToSpecialist(scene: string, context: any): Promise<any[]> {
  const specialistUrls = {
    'meeting': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/advice-meeting',
    'sales': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/advice-sales',
    'presentation': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/advice-presentation',
    'interview': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/advice-interview',
    'team_building': 'https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/advice-team-building'
  };

  const specialistUrl = specialistUrls[scene as keyof typeof specialistUrls];
  
  if (specialistUrl) {
    try {
      console.log(`Routing to specialist: ${scene} at ${specialistUrl}`);
      console.log(`Context being sent to specialist:`, context);
      
      const response = await fetch(specialistUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Specialist ${scene} response:`, data);
        return data.advices || [];
      } else {
        console.error(`Specialist ${scene} failed with status:`, response.status);
        const errorText = await response.text();
        console.error(`Error response:`, errorText);
      }
    } catch (error) {
      console.error(`Specialist ${scene} failed:`, error);
    }
  }
  
  // 専門アドバイザーが失敗した場合は汎用アドバイスを使用
  console.log(`Falling back to generic advice for scene: ${scene}`);
  return generateGenericAdvice(context);
}

// シーン別の専門的なプロンプトを生成
function getSceneSpecificPrompt(scene: string): string {
  const scenePrompts: Record<string, string> = {
    'meeting': `会議・ミーティングシーンに特化した専門的なアドバイスを含めてください：
- 会議の種類と形式に応じた最適な進行方法
- 参加者数とタイプに応じたエンゲージメント向上策
- 時間管理と意思決定プロセスの最適化
- オンライン/対面/ハイブリッドでの効果的な運営
- 緊急度と頻度に応じた準備レベルと進行の厳密性`,

    'sales': `営業・商談シーンに特化した専門的なアドバイスを含めてください：
- 業界特化型の顧客ニーズ分析と課題解決
- 顧客タイプと役職レベルに応じたアプローチ方法
- 営業段階に応じた最適な戦略と次の段階への準備
- 商談規模と競合レベルに応じた差別化戦略
- 顧客の具体的な課題へのソリューション提案`,

    'presentation': `プレゼンテーションシーンに特化した専門的なアドバイスを含めてください：
- 目的に応じた最適な構成とストーリーテリング
- 聴衆のタイプと専門性に応じたコミュニケーション方法
- 形式（対面/オンライン/ハイブリッド）に応じた効果的な手法
- 指定された内容に最適化された視覚資料と例示方法
- 制約事項への対応策とリスク管理`,

    'interview': `面談シーンに特化した専門的なアドバイスを含めてください：
- 面談の種類に応じた最適な準備方法と進行のポイント
- 目的を達成するための構成、質問設計、結論の導き方
- 関係性に応じた効果的なコミュニケーションと信頼構築
- 文脈に応じた準備レベルと進行の柔軟性
- 期待される成果を確実に得るための具体的な手法`,

    'team_building': `チーム構築・チームビルディングシーンに特化した専門的なアドバイスを含めてください：
- チーム構築の種類に応じた最適な手法と進行のポイント
- チームの成熟度に応じた適切な介入方法と次の段階への促進策
- チーム規模に応じた効果的なコミュニケーションと役割分担
- チームの状況に応じた戦略、リスク管理、継続的な改善策
- 多様性を活かしたチーム構築とインクルーシブな環境づくり`
  };

  return scenePrompts[scene] || `一般的なビジネスシーンに特化した専門的なアドバイスを含めてください：
- 目的と目標の明確化と達成への具体的なアプローチ
- 関係者の理解と調整による効果的な協働
- リスク要因の特定と具体的な対策の提案
- 成功指標の設定と測定方法の明確化
- フォローアップ計画と継続的な改善の実現`;
}

// 汎用AIアドバイス生成（フォールバック用）
async function generateGenericAdvice(context: any): Promise<any[]> {
  const prompt = `あなたは組織変革とリーダーシップの専門家です。
以下の詳細な状況に基づいて、具体的で実践的なアドバイスを3つ提供してください。

**基本状況:**
- シーン: ${context.scene}
- 目標: ${context.goal}
- 参加者数: ${context.participants || '未指定'}人
- 関係性: ${context.relationship || '未指定'}
- 時間制限: ${context.time_limit || '未指定'}
- 重要度: ${context.stakes || '未指定'}

**詳細設定（シーン別）:**
${context.scene === 'meeting' ? `
**会議・ミーティングの詳細:**
- 会議の種類: ${context.meeting_type || '未指定'}
- 会議形式: ${context.meeting_format || '未指定'}
- 緊急度: ${context.meeting_urgency || '未指定'}
- 頻度: ${context.meeting_frequency || '未指定'}
- 参加者タイプ: ${context.meeting_participants || '未指定'}
- 使用ツール: ${context.meeting_tools || '未指定'}
- 想定される課題: ${context.meeting_challenges || '未指定'}` : ''}

${context.scene === 'sales' ? `
**営業・商談の詳細:**
- 顧客タイプ: ${context.customer_type || '未指定'}
- 業界: ${context.industry || '未指定'}
- 顧客の役職: ${context.customer_position || '未指定'}
- 会社規模: ${context.company_size || '未指定'}
- 営業段階: ${context.sales_stage || '未指定'}
- 商談規模: ${context.deal_size || '未指定'}
- 競合レベル: ${context.competition_level || '未指定'}
- 顧客の課題: ${context.customer_pain_points || '未指定'}` : ''}

${context.scene === 'presentation' ? `
**プレゼンテーションの詳細:**
- 目的: ${context.presentation_purpose || '未指定'}
- 聴衆のタイプ: ${context.audience_type || '未指定'}
- 形式: ${context.presentation_format || '未指定'}
- 内容: ${context.presentation_topics || '未指定'}
- 聴衆の専門性: ${context.audience_expertise || '未指定'}
- 制約事項: ${context.presentation_constraints || '未指定'}` : ''}

${context.scene === 'interview' ? `
**面談の詳細:**
- 面談の種類: ${context.interview_type || '未指定'}
- 目的: ${context.interview_purpose || '未指定'}
- 関係性: ${context.interview_relationship || '未指定'}
- 文脈: ${context.interview_context || '未指定'}
- 期待される成果: ${context.interview_outcomes || '未指定'}` : ''}

${context.scene === 'team_building' ? `
**チーム構築の詳細:**
- タイプ: ${context.team_building_type || '未指定'}
- チームの成熟度: ${context.team_maturity || '未指定'}
- 文脈: ${context.team_context || '未指定'}
- チーム規模: ${context.team_size || '未指定'}
- 多様性: ${context.team_diversity || '未指定'}
- 課題: ${context.team_challenges || '未指定'}` : ''}

**シーン別の専門性:**
${getSceneSpecificPrompt(context.scene)}

**重要:**
上記の詳細設定を踏まえて、以下の点を考慮した具体的で実践的なアドバイスを提供してください：

1. **状況特化**: 設定された詳細に基づいた具体的なシナリオ
2. **実用性**: すぐに実行できる具体的な行動指針
3. **効果測定**: 設定された状況での成功指標
4. **リスク管理**: 想定される課題への対応策
5. **段階的アプローチ**: 時間制限と重要度を考慮した実装計画

各アドバイスは以下の形式で提供してください：
{
  "advices": [
    {
      "theory_id": "理論名（英語）",
      "theory_name_ja": "日本語理論名",
      "short_advice": "詳細設定を反映した具体的な行動指針（200文字以内）",
      "expected_effect": "設定された状況での期待される効果（100文字以内）",
      "caution": "設定された状況での注意点（80文字以内）",
      "tips": "実践のコツ（80文字以内）",
      "related_theory": "関連理論（50文字以内）",
      "implementation_steps": [
        "ステップ1（詳細設定を考慮）",
        "ステップ2（詳細設定を考慮）", 
        "ステップ3（詳細設定を考慮）"
      ],
      "success_indicators": [
        "指標1（設定された状況での測定方法）",
        "指標2（設定された状況での測定方法）",
        "指標3（設定された状況での測定方法）"
      ],
      "common_mistakes": [
        "間違い1（設定された状況での注意点）",
        "間違い2（設定された状況での注意点）",
        "間違い3（設定された状況での注意点）"
      ]
    }
  ]
}`

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "あなたは組織変革とリーダーシップの専門家です。常に実践的で具体的なアドバイスを提供してください。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // JSONレスポンスを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response")
    }
    
    const aiResponse = JSON.parse(jsonMatch[0])
    return aiResponse.advices || []
  } catch (error) {
    console.error("Generic AI generation failed:", error);
    return generateFallbackAdvice(context);
  }
}

// フォールバック用の基本アドバイス生成
function generateFallbackAdvice(context: any): any[] {
  return [
    {
      theory_id: "basic_approach",
      theory_name_ja: "基本的なアプローチ",
      short_advice: "状況に応じて柔軟に対応し、相手の反応を注意深く観察する",
      expected_effect: "基本的な効果的なアプローチが実現できる",
      caution: "状況を無視して機械的に適用しない",
      tips: "相手の反応を見ながら調整する",
      related_theory: "状況適応理論",
      implementation_steps: [
        "1. 状況を正確に把握する",
        "2. 提案されたアプローチを実践する",
        "3. 結果を観察し、必要に応じて調整する"
      ],
      success_indicators: [
        "相手からのポジティブな反応",
        "目標の達成",
        "関係性の改善"
      ],
      common_mistakes: [
        "状況を無視した画一的な対応",
        "相手の反応を観察しない",
        "柔軟性の欠如"
      ]
    }
  ];
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    console.log('Advice function called with method:', req.method);
    console.log('Request URL:', req.url);
    
    const body: Payload = await req.json()
    console.log('Request body:', body);
    
    const sb = adminClient()

    console.log('Received request for scene:', body.scene);

    // 1) セッション保存
    const { data: session, error: sessionError } = await sb.from("sessions").insert({
      scene_id: body.scene, goal: body.goal, participants: body.participants ?? null,
      relationship: body.relationship, time_limit: body.time_limit, stakes: body.stakes
    }).select().single()

    if (sessionError || !session) {
      console.error('Session creation error:', sessionError)
      return new Response(JSON.stringify({ 
        error: "Failed to create session" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }

    // 2) シーン別の専門アドバイザーにルーティング
    const context = {
      scene: body.scene,
      goal: body.goal || "decide",
      time_limit: body.time_limit || "medium",
      stakes: body.stakes || "medium",
      participants: body.participants,
      relationship: body.relationship
    };

    console.log('Routing context:', context);

    let advices: any[] = []

    try {
      console.log('Attempting to route to specialist for scene:', body.scene);
      advices = await routeToSpecialist(body.scene, context);
      console.log('Specialist routing successful, got advices:', advices.length);
    } catch (error) {
      console.error("Specialist routing failed:", error);
      console.log('Falling back to generic advice');
      advices = await generateGenericAdvice(context);
      console.log('Generic advice generated:', advices.length);
    }

    // 3) アドバイスをセッションに保存
    if (advices.length > 0) {
      console.log('Saving advices to session_advices table');
      const { error: adviceError } = await sb.from("session_advices").insert(
        advices.map((a, i) => ({ 
          session_id: session.id,
          theory_id: a.theory_id,
          short_advice: a.short_advice,
          selected_rank: i + 1
        }))
      )

      if (adviceError) {
        console.error('Advice insertion error:', adviceError)
        console.error('Advice insertion error details:', {
          message: adviceError.message,
          details: adviceError.details,
          hint: adviceError.hint
        });
      } else {
        console.log('Advices saved successfully to session_advices');
      }
    } else {
      console.warn('No advices to save to session_advices');
    }

    const responseData = { 
      session_id: session.id, 
      advices: advices.map((a, i) => ({
        theory_id: a.theory_id,
        theory_name_ja: a.theory_name_ja,
        short_advice: a.short_advice,
        expected_effect: a.expected_effect,
        caution: a.caution,
        tips: a.tips,
        related_theory: a.related_theory,
        implementation_steps: a.implementation_steps,
        success_indicators: a.success_indicators,
        common_mistakes: a.common_mistakes,
        selected_rank: i + 1
      }))
    };
    
    console.log('Sending response with session_id:', session.id, 'and advices count:', advices.length);
    
    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})