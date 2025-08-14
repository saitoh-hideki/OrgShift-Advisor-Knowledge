// POST: { scene, goal, participants, relationship, time_limit, stakes }
// res : { session_id, advices:[{theory_id, short_advice, expected_effect, caution, tips, related_theory, implementation_steps, success_indicators, common_mistakes}] }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient } from "../_shared/client.ts"

type Payload = {
  scene: string; goal?: string; participants?: number;
  relationship?: string; time_limit?: "short"|"medium"|"long";
  stakes?: "low"|"medium"|"high";
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

// 汎用AIアドバイス生成（フォールバック用）
async function generateGenericAdvice(context: any): Promise<any[]> {
  const prompt = `あなたは組織変革とリーダーシップの専門家です。
以下の状況に基づいて、具体的で実践的なアドバイスを3つ提供してください。

状況:
- シーン: ${context.scene}
- 目標: ${context.goal}
- 時間制限: ${context.time_limit}
- 重要度: ${context.stakes}
${context.participants ? `- 参加者数: ${context.participants}人` : ''}
${context.relationship ? `- 関係性: ${context.relationship}` : ''}

各アドバイスは以下の形式で提供してください：
1. 理論名（英語）
2. 日本語理論名
3. 具体的な行動指針（150文字以内）
4. 期待される効果（80文字以内）
5. 注意点（60文字以内）
6. 実践のコツ（50文字以内）
7. 関連する理論や研究（30文字以内）
8. 実装ステップ（3ステップ）
9. 成功指標（3つ）
10. よくある間違い（3つ）

JSON形式で返してください：
{
  "advices": [
    {
      "theory_id": "理論名",
      "theory_name_ja": "日本語理論名",
      "short_advice": "具体的な行動指針",
      "expected_effect": "期待される効果",
      "caution": "注意点",
      "tips": "実践のコツ",
      "related_theory": "関連理論",
      "implementation_steps": ["ステップ1", "ステップ2", "ステップ3"],
      "success_indicators": ["指標1", "指標2", "指標3"],
      "common_mistakes": ["間違い1", "間違い2", "間違い3"]
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
    const body: Payload = await req.json()
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

    let advices: any[] = []

    try {
      advices = await routeToSpecialist(body.scene, context);
    } catch (error) {
      console.error("Specialist routing failed:", error);
      advices = await generateGenericAdvice(context);
    }

    // 3) アドバイスをセッションに保存
    if (advices.length > 0) {
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
      }
    }

    return new Response(JSON.stringify({ 
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
    }), {
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