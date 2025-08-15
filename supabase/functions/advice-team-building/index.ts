import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TeamBuildingContext {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  team_building_type?: string;
  team_size?: number;
  team_maturity?: string;
  team_context?: string;
  team_diversity?: string;
  team_challenges?: string;
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
    const context: TeamBuildingContext = await req.json()
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // チーム構築専用の詳細プロンプト
    const prompt = `あなたはチーム構築・チームビルディングの専門家です。
以下の詳細なチーム構築状況に基づいて、具体的で実践的なアドバイスを3つ提供してください。

**基本情報:**
- 目標: ${context.goal}
- 時間制限: ${context.time_limit}
- 重要度: ${context.stakes}
- 参加者数: ${context.participants || '未指定'}人
- 関係性: ${context.relationship || '未指定'}

**チーム構築の詳細設定:**
- チーム構築の種類: ${context.team_building_type || '未指定'}
- チームサイズ: ${context.team_size || '未指定'}人
- チームの成熟度: ${context.team_maturity || '未指定'}
- チームの状況: ${context.team_context || '未指定'}
- チームの多様性: ${context.team_diversity || '未指定'}
- チームの課題: ${context.team_challenges || '未指定'}

**重要:**
上記の詳細設定を踏まえて、以下の点を考慮した具体的で実践的なアドバイスを提供してください：

1. **チームタイプ特化**: 新チーム構築、既存チーム強化、チーム再編成など種類に応じた最適なアプローチ
2. **成熟度対応**: 形成期、混乱期、規範期、実行期など段階に応じた適切な介入方法
3. **規模最適化**: 小規模、中規模、大規模チームに応じた効果的な手法
4. **文脈理解**: 新規プロジェクト、組織変革、危機対応など状況に応じた戦略
5. **多様性活用**: 年齢、性別、文化的背景、専門性の多様性を活かしたチーム構築
6. **課題解決**: コミュニケーション不足、信頼関係の欠如、目標の不一致など具体的な課題への対応

**具体的な要求:**
${context.team_building_type ? `- チーム構築の種類「${context.team_building_type}」に特化した最適な手法、進行のポイント、成功の鍵となる要素を具体的に示してください。` : ''}
${context.team_maturity ? `- チームの成熟度「${context.team_maturity}」に応じた適切な介入方法、次の段階への促進策、注意すべきポイントを提案してください。` : ''}
${context.team_size ? `- チームサイズ「${context.team_size}人」での効果的なコミュニケーション方法、役割分担、意思決定プロセスを最適化してください。` : ''}
${context.team_context ? `- チームの状況「${context.team_context}」に応じた戦略、リスク管理、継続的な改善策を提案してください。` : ''}
${context.team_diversity ? `- チームの多様性「${context.team_diversity}」を活かしたチーム構築方法、インクルーシブな環境づくり、多様性の価値を最大化する手法を示してください。` : ''}
${context.team_challenges ? `- チームの課題「${context.team_challenges}」への具体的な解決策、予防策、長期的な改善方法を提案してください。` : ''}

各アドバイスは以下の形式で提供してください：
{
  "advices": [
    {
      "theory_id": "理論名（英語）",
      "theory_name_ja": "日本語理論名",
      "short_advice": "詳細設定を反映した具体的な行動指針（200文字以内）",
      "expected_effect": "設定されたチーム構築状況での期待される効果（100文字以内）",
      "caution": "設定されたチーム構築状況での注意点（80文字以内）",
      "tips": "実践のコツ（80文字以内）",
      "related_theory": "関連理論（50文字以内）",
      "implementation_steps": [
        "ステップ1（詳細設定を考慮した具体的な行動）",
        "ステップ2（詳細設定を考慮した具体的な行動）", 
        "ステップ3（詳細設定を考慮した具体的な行動）"
      ],
      "success_indicators": [
        "指標1（設定されたチーム構築状況での測定方法）",
        "指標2（設定されたチーム構築状況での測定方法）",
        "指標3（設定されたチーム構築状況での測定方法）"
      ],
      "common_mistakes": [
        "間違い1（設定されたチーム構築状況での注意点）",
        "間違い2（設定されたチーム構築状況での注意点）",
        "間違い3（設定されたチーム構築状況での注意点）"
      ]
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
            content: "あなたはチーム構築・チームビルディングの専門家です。常に実践的で具体的なアドバイスを提供してください。"
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
