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
  presentation_topics?: string;
  audience_expertise?: string;
  presentation_constraints?: string;
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
    console.log('Presentation advice function called');
    const context: PresentationContext = await req.json()
    console.log('Request context:', context);
    
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // プレゼンテーション専用の詳細プロンプト
    const prompt = `あなたはプレゼンテーションの専門家です。
以下の詳細なプレゼンテーション状況に基づいて、具体的で実践的なアドバイスを3つ提供してください。

**基本情報:**
- 目標: ${context.goal}
- 時間制限: ${context.time_limit}
- 重要度: ${context.stakes}
- 参加者数: ${context.participants || '未指定'}人
- 関係性: ${context.relationship || '未指定'}

**プレゼンテーションの詳細設定:**
- 目的: ${context.presentation_purpose || '未指定'}
- 聴衆のタイプ: ${context.audience_type || '未指定'}
- 聴衆の人数: ${context.audience_count || '未指定'}人
- 形式: ${context.presentation_format || '未指定'}
- 内容: ${context.presentation_topics || '未指定'}
- 聴衆の専門性: ${context.audience_expertise || '未指定'}
- 制約事項: ${context.presentation_constraints || '未指定'}

**重要:**
上記の詳細設定を踏まえて、以下の点を考慮した具体的で実践的なアドバイスを提供してください：

1. **目的特化**: 提案、報告、教育、説得など目的に応じた最適な構成
2. **聴衆対応**: 聴衆のタイプ、専門性、人数に応じたコミュニケーション方法
3. **形式最適化**: 対面、オンライン、ハイブリッドに応じた効果的な手法
4. **内容設計**: 指定された内容に最適化されたストーリーテリング
5. **制約対応**: 時間制限、技術的制約、文化的制約への対応策
6. **エンゲージメント**: 聴衆の関心を引き、理解を促進する方法

**具体的な要求:**
${context.presentation_purpose ? `- 目的「${context.presentation_purpose}」に最適化された構成、ストーリーテリング、結論の設計を提案してください。` : ''}
${context.audience_type ? `- 聴衆タイプ「${context.audience_type}」に特化したアプローチ方法、用語選択、例示方法を具体的に示してください。` : ''}
${context.audience_expertise ? `- 聴衆の専門性「${context.audience_expertise}」に応じた内容の深さ、専門用語の使用、説明の詳細度を調整してください。` : ''}
${context.presentation_format ? `- 形式「${context.presentation_format}」での効果的な進行方法、ツール活用、参加者とのインタラクション方法を提案してください。` : ''}
${context.presentation_topics ? `- 内容「${context.presentation_topics}」に特化した構成、視覚資料、例示方法を具体的に示してください。` : ''}
${context.presentation_constraints ? `- 制約事項「${context.presentation_constraints}」への対応策、リスク管理、代替案を提案してください。` : ''}

各アドバイスは以下の形式で提供してください：
{
  "advices": [
    {
      "theory_id": "理論名（英語）",
      "theory_name_ja": "日本語理論名",
      "short_advice": "詳細設定を反映した具体的な行動指針（200文字以内）",
      "expected_effect": "設定されたプレゼン状況での期待される効果（100文字以内）",
      "caution": "設定されたプレゼン状況での注意点（80文字以内）",
      "tips": "実践のコツ（80文字以内）",
      "related_theory": "関連理論（50文字以内）",
      "implementation_steps": [
        "ステップ1（詳細設定を考慮した具体的な行動）",
        "ステップ2（詳細設定を考慮した具体的な行動）", 
        "ステップ3（詳細設定を考慮した具体的な行動）"
      ],
      "success_indicators": [
        "指標1（設定されたプレゼン状況での測定方法）",
        "指標2（設定されたプレゼン状況での測定方法）",
        "指標3（設定されたプレゼン状況での測定方法）"
      ],
      "common_mistakes": [
        "間違い1（設定されたプレゼン状況での注意点）",
        "間違い2（設定されたプレゼン状況での注意点）",
        "間違い3（設定されたプレゼン状況での注意点）"
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
    console.log('OpenAI response content:', content);
    
    // JSONレスポンスを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to parse AI response, content:', content);
      throw new Error("Failed to parse AI response")
    }
    
    const aiResponse = JSON.parse(jsonMatch[0])
    console.log('Parsed AI response:', aiResponse);
    const advices: AIAdvice[] = aiResponse.advices || []
    console.log('Extracted advices:', advices);

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
