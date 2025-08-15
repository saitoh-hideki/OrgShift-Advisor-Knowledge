import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SalesContext {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  customer_type?: string;
  industry?: string;
  customer_position?: string;
  company_size?: string;
  sales_stage?: string;
  deal_size?: string;
  competition_level?: string;
  customer_pain_points?: string;
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
    const context: SalesContext = await req.json()
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // 営業専用の詳細プロンプト
    const prompt = `あなたは営業・商談の専門家です。
以下の詳細な営業状況に基づいて、業界特化型で具体的で実践的なアドバイスを3つ提供してください。

**基本情報:**
- 目標: ${context.goal}
- 時間制限: ${context.time_limit}
- 重要度: ${context.stakes}
- 参加者数: ${context.participants || '未指定'}人
- 関係性: ${context.relationship || '未指定'}

**営業の詳細設定:**
- 顧客タイプ: ${context.customer_type || '未指定'}
- 業界: ${context.industry || '未指定'}
- 顧客の役職: ${context.customer_position || '未指定'}
- 会社規模: ${context.company_size || '未指定'}
- 営業段階: ${context.sales_stage || '未指定'}
- 商談規模: ${context.deal_size || '未指定'}
- 競合レベル: ${context.competition_level || '未指定'}
- 顧客の課題: ${context.customer_pain_points || '未指定'}

**重要:**
上記の詳細設定を踏まえて、以下の点を考慮した具体的で実践的なアドバイスを提供してください：

1. **業界特化**: 指定された業界の特性、トレンド、課題を深く理解した提案
2. **顧客タイプ対応**: 新規顧客、既存顧客、代理店などに応じたアプローチ
3. **意思決定者対応**: 役職レベルに応じた効果的なコミュニケーション方法
4. **営業段階最適化**: 各段階での最適な戦略と次の段階への準備
5. **競合対策**: 競合レベルに応じた差別化戦略
6. **課題解決**: 顧客の具体的な課題へのソリューション提案

**具体的な要求:**
${context.industry ? `- 業界「${context.industry}」の特性、トレンド、成功パターン、失敗パターンを深く分析し、業界特化型の戦略を提案してください。` : ''}
${context.customer_type ? `- 顧客タイプ「${context.customer_type}」に特化したアプローチ方法、信頼構築のポイント、長期的な関係性の築き方を具体的に示してください。` : ''}
${context.sales_stage ? `- 営業段階「${context.sales_stage}」での最適な戦略、次の段階への準備、成功の鍵となる要素を明確にしてください。` : ''}
${context.customer_position ? `- 「${context.customer_position}」レベルの意思決定者への効果的なアプローチ方法、意思決定プロセスへの影響、関係性構築のポイントを具体的に示してください。` : ''}
${context.deal_size ? `- 商談規模「${context.deal_size}」に応じた提案内容、リソース配分、リスク管理を考慮してください。` : ''}
${context.competition_level ? `- 競合レベル「${context.competition_level}」での差別化戦略、価値提案の強化、顧客の選択理由を明確にしてください。` : ''}
${context.customer_pain_points ? `- 顧客の課題「${context.customer_pain_points}」への具体的なソリューション、価値の証明方法、効果測定の方法を提案してください。` : ''}

各アドバイスは以下の形式で提供してください：
{
  "advices": [
    {
      "theory_id": "理論名（英語）",
      "theory_name_ja": "日本語理論名",
      "short_advice": "詳細設定を反映した具体的な行動指針（200文字以内）",
      "expected_effect": "設定された営業状況での期待される効果（100文字以内）",
      "caution": "設定された営業状況での注意点（80文字以内）",
      "tips": "実践のコツ（80文字以内）",
      "related_theory": "関連理論（50文字以内）",
      "implementation_steps": [
        "ステップ1（詳細設定を考慮した具体的な行動）",
        "ステップ2（詳細設定を考慮した具体的な行動）", 
        "ステップ3（詳細設定を考慮した具体的な行動）"
      ],
      "success_indicators": [
        "指標1（設定された営業状況での測定方法）",
        "指標2（設定された営業状況での測定方法）",
        "指標3（設定された営業状況での測定方法）"
      ],
      "common_mistakes": [
        "間違い1（設定された営業状況での注意点）",
        "間違い2（設定された営業状況での注意点）",
        "間違い3（設定された営業状況での注意点）"
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
            content: "あなたは営業・商談の専門家です。常に実践的で具体的なアドバイスを提供してください。"
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
