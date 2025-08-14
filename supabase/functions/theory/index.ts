// GET ?id=anchoring -> 理論の"学びカード"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TheoryRequest {
  id: string;
  theory_name?: string;
  theory_name_ja?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let theoryId: string;
    let theoryName: string | undefined;
    let theoryNameJa: string | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url)
      theoryId = url.searchParams.get("id") || '';
      theoryName = url.searchParams.get("name") || undefined;
      theoryNameJa = url.searchParams.get("name_ja") || undefined;
    } else if (req.method === 'POST') {
      const body: TheoryRequest = await req.json();
      theoryId = body.id;
      theoryName = body.theory_name;
      theoryNameJa = body.theory_name_ja;
    } else {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    if (!theoryId) {
      return new Response("Theory ID required", { status: 400, headers: corsHeaders })
    }

    const sb = adminClient()
    
    // まずデータベースから理論を検索
    const { data: dbTheory, error: dbError } = await sb.from("theories").select("*").eq("id", theoryId).single()
    
    if (dbTheory && !dbError) {
      // データベースに理論が存在する場合
      const card = {
        id: dbTheory.id,
        name: dbTheory.name_ja || dbTheory.name_en,
        description: dbTheory.one_liner || dbTheory.mechanism,
        key_concepts: dbTheory.how_to ? [dbTheory.how_to] : [],
        when_to_use: dbTheory.when_to_use ? [dbTheory.when_to_use] : [],
        examples: dbTheory.examples ? [dbTheory.examples] : []
      }
      
      return new Response(JSON.stringify(card), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // データベースに理論が存在しない場合、AIで理論を生成
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    const theoryNameToUse = theoryNameJa || theoryName || theoryId;
    
    const prompt = `あなたは組織変革とリーダーシップの理論の専門家です。
以下の理論について、詳細で実践的な説明を提供してください。

理論名: ${theoryNameToUse}

以下の形式でJSONで返してください：
{
  "id": "${theoryId}",
  "name": "理論の日本語名",
  "description": "理論の詳細な説明（200文字程度）",
  "key_concepts": [
    "主要概念1（50文字程度）",
    "主要概念2（50文字程度）",
    "主要概念3（50文字程度）"
  ],
  "when_to_use": [
    "使用場面1（50文字程度）",
    "使用場面2（50文字程度）",
    "使用場面3（50文字程度）"
  ],
  "examples": [
    "具体例1（80文字程度）",
    "具体例2（80文字程度）",
    "具体例3（80文字程度）"
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
            content: "あなたは組織変革とリーダーシップの理論の専門家です。常に実践的で具体的な説明を提供してください。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
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
    
    const aiTheory = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(aiTheory), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Theory function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})