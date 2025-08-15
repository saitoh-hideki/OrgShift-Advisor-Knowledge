import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InterviewContext {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  interview_type?: string;
  interview_purpose?: string;
  interview_relationship?: string;
  interview_context?: string;
  interview_outcomes?: string;
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
    const context: InterviewContext = await req.json()
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // 面談専用の詳細プロンプト
    const prompt = `あなたは面談の専門家です。
以下の詳細な面談状況に基づいて、具体的で実践的なアドバイスを3つ提供してください。

**基本情報:**
- 目標: ${context.goal}
- 時間制限: ${context.time_limit}
- 重要度: ${context.stakes}
- 参加者数: ${context.participants || '未指定'}人
- 関係性: ${context.relationship || '未指定'}

**面談の詳細設定:**
- 面談の種類: ${context.interview_type || '未指定'}
- 目的: ${context.interview_purpose || '未指定'}
- 面談での関係性: ${context.interview_relationship || '未指定'}
- 面談の文脈: ${context.interview_context || '未指定'}
- 期待される成果: ${context.interview_outcomes || '未指定'}

**重要:**
上記の詳細設定を踏まえて、以下の点を考慮した具体的で実践的なアドバイスを提供してください：

1. **面談タイプ特化**: 採用面接、評価面談、1on1、メンタリングなど種類に応じた最適なアプローチ
2. **目的対応**: 評価、指導、相談解決、関係構築など目的に応じた進行方法
3. **関係性構築**: 上司-部下、人事-従業員、メンター-メンティーなど関係性に応じた信頼構築
4. **文脈理解**: 定期面談、問題対応、キャリア相談など文脈に応じた準備と進行
5. **成果導出**: 目標の明確化、行動計画の策定、課題の解決など期待される成果への導線
6. **時間管理**: 時間制限内での効果的なコミュニケーションと結論の導出

**具体的な要求:**
${context.interview_type ? `- 面談の種類「${context.interview_type}」に特化した準備方法、進行のポイント、フォローアップ方法を具体的に示してください。` : ''}
${context.interview_purpose ? `- 目的「${context.interview_purpose}」を達成するための最適な構成、質問設計、結論の導き方を提案してください。` : ''}
${context.interview_relationship ? `- 関係性「${context.interview_relationship}」での効果的なコミュニケーション方法、信頼構築のポイント、長期的な関係性の築き方を示してください。` : ''}
${context.interview_context ? `- 文脈「${context.interview_context}」に応じた準備レベル、進行の柔軟性、緊急度への対応を考慮してください。` : ''}
${context.interview_outcomes ? `- 期待される成果「${context.interview_outcomes}」を確実に得るための具体的な手法、測定方法、継続的な改善策を提案してください。` : ''}

各アドバイスは以下の形式で提供してください：
{
  "advices": [
    {
      "theory_id": "理論名（英語）",
      "theory_name_ja": "日本語理論名",
      "short_advice": "詳細設定を反映した具体的な行動指針（200文字以内）",
      "expected_effect": "設定された面談状況での期待される効果（100文字以内）",
      "caution": "設定された面談状況での注意点（80文字以内）",
      "tips": "実践のコツ（80文字以内）",
      "related_theory": "関連理論（50文字以内）",
      "implementation_steps": [
        "ステップ1（詳細設定を考慮した具体的な行動）",
        "ステップ2（詳細設定を考慮した具体的な行動）", 
        "ステップ3（詳細設定を考慮した具体的な行動）"
      ],
      "success_indicators": [
        "指標1（設定された面談状況での測定方法）",
        "指標2（設定された面談状況での測定方法）",
        "指標3（設定された面談状況での測定方法）"
      ],
      "common_mistakes": [
        "間違い1（設定された面談状況での注意点）",
        "間違い2（設定された面談状況での注意点）",
        "間違い3（設定された面談状況での注意点）"
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
            content: "あなたは面談の専門家です。常に実践的で具体的なアドバイスを提供してください。"
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
