import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PresentationContext {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  presentation_purpose?: string;
  audience_type?: string;
  audience_count?: number;
  presentation_format?: string;
}

interface AIAdvice {
  theory_id: string;
  theory_name_ja: string;
  short_advice: string;
  expected_effect: string;
  caution: string;
  tips: string;
  related_theory: string;
  implementation_steps: string[];
  success_indicators: string[];
  common_mistakes: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const context: PresentationContext = await req.json()
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // プレゼンテーション専用の詳細プロンプト
    const prompt = `あなたはプレゼンテーションの専門家です。
以下のプレゼンテーションの詳細に基づいて、具体的で実践的なアドバイスを3つ提供してください。

プレゼンテーションの詳細:
- 目標: ${context.goal}
- 時間制限: ${context.time_limit}
- 重要度: ${context.stakes}
- 参加者数: ${context.participants || '未指定'}人
- 関係性: ${context.relationship || '未指定'}
${context.presentation_purpose ? `- プレゼンテーションの目的: ${context.presentation_purpose}` : ''}
${context.audience_type ? `- 聴衆のタイプ: ${context.audience_type}` : ''}
${context.audience_count ? `- 聴衆の人数: ${context.audience_count}人` : ''}
${context.presentation_format ? `- プレゼンテーション形式: ${context.presentation_format}` : ''}

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
            content: "あなたはプレゼンテーションの専門家です。常に実践的で具体的なアドバイスを提供してください。"
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
    const advices: AIAdvice[] = aiResponse.advices || []

    return new Response(JSON.stringify({ advices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
