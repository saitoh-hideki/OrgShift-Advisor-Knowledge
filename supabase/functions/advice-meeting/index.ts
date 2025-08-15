import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MeetingContext {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  meeting_type?: string;
  meeting_format?: string;
  meeting_urgency?: string;
  meeting_frequency?: string;
  meeting_participants?: string;
  meeting_tools?: string;
  meeting_challenges?: string;
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
    const context: MeetingContext = await req.json()
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // 会議専用の詳細プロンプト
    const prompt = `あなたは会議・ミーティングの専門家です。
以下の詳細な会議の状況に基づいて、具体的で実践的なアドバイスを3つ提供してください。

**基本情報:**
- 目標: ${context.goal}
- 時間制限: ${context.time_limit}
- 重要度: ${context.stakes}
- 参加者数: ${context.participants || '未指定'}人
- 関係性: ${context.relationship || '未指定'}

**会議の詳細設定:**
- 会議の種類: ${context.meeting_type || '未指定'}
- 会議形式: ${context.meeting_format || '未指定'}
- 緊急度: ${context.meeting_urgency || '未指定'}
- 頻度: ${context.meeting_frequency || '未指定'}
- 参加者タイプ: ${context.meeting_participants || '未指定'}
- 使用ツール: ${context.meeting_tools || '未指定'}
- 想定される課題: ${context.meeting_challenges || '未指定'}

**重要:**
上記の詳細設定を踏まえて、以下の点を考慮した具体的で実践的なアドバイスを提供してください：

1. **状況特化**: 設定された会議の種類、形式、緊急度、頻度を考慮
2. **参加者対応**: 参加者数、タイプ、関係性に応じた進行方法
3. **ツール活用**: 指定されたツールを効果的に活用する方法
4. **課題対策**: 想定される課題への具体的な対応策
5. **時間管理**: 時間制限内での効率的な進行方法
6. **重要度対応**: 重要度に応じた準備レベルと進行の厳密性

**具体的な要求:**
- オンライン会議の場合は、技術的な準備や参加者のエンゲージメント向上策を含める
- 緊急会議の場合は、迅速な意思決定プロセスとフォローアップ体制を含める
- 定例会議の場合は、効率化と継続的な改善策を含める
- 意思決定会議の場合は、合意形成プロセスと責任分担を含める

各アドバイスは以下の形式で提供してください：
{
  "advices": [
    {
      "theory_id": "理論名（英語）",
      "theory_name_ja": "日本語理論名",
      "short_advice": "詳細設定を反映した具体的な行動指針（200文字以内）",
      "expected_effect": "設定された会議状況での期待される効果（100文字以内）",
      "caution": "設定された会議状況での注意点（80文字以内）",
      "tips": "実践のコツ（80文字以内）",
      "related_theory": "関連理論（50文字以内）",
      "implementation_steps": [
        "ステップ1（詳細設定を考慮した具体的な行動）",
        "ステップ2（詳細設定を考慮した具体的な行動）", 
        "ステップ3（詳細設定を考慮した具体的な行動）"
      ],
      "success_indicators": [
        "指標1（設定された会議状況での測定方法）",
        "指標2（設定された会議状況での測定方法）",
        "指標3（設定された会議状況での測定方法）"
      ],
      "common_mistakes": [
        "間違い1（設定された会議状況での注意点）",
        "間違い2（設定された会議状況での注意点）",
        "間違い3（設定された会議状況での注意点）"
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
            content: "あなたは会議・ミーティングの専門家です。常に実践的で具体的なアドバイスを提供してください。"
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
