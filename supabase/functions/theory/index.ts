// アドバイスに関連する理論をAIで探して表示する機能
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TheoryRequest {
  id?: string;
  theory_name?: string;
  theory_name_ja?: string;
  // アドバイスに関連する情報を追加
  advice_context?: string;
  scene?: string;
  goal?: string;
  short_advice?: string;
}

interface TheoryCard {
  id: string;
  name: string;
  description: string;
  key_concepts: string[];
  when_to_use: string[];
  examples: string[];
  related_theories?: string[];
  practical_tips?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Theory function called with method:', req.method);
    console.log('Request URL:', req.url);
    
    let theoryId: string | undefined;
    let theoryName: string | undefined;
    let theoryNameJa: string | undefined;
    let adviceContext: string | undefined;
    let scene: string | undefined;
    let goal: string | undefined;
    let shortAdvice: string | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url)
      theoryId = url.searchParams.get("id") || undefined;
      theoryName = url.searchParams.get("name") || undefined;
      theoryNameJa = url.searchParams.get("name_ja") || undefined;
      adviceContext = url.searchParams.get("advice_context") || undefined;
      scene = url.searchParams.get("scene") || undefined;
      goal = url.searchParams.get("goal") || undefined;
      shortAdvice = url.searchParams.get("short_advice") || undefined;
    } else if (req.method === 'POST') {
      const body: TheoryRequest = await req.json();
      console.log('POST request body:', body);
      
      theoryId = body.id;
      theoryName = body.theory_name;
      theoryNameJa = body.theory_name_ja;
      adviceContext = body.advice_context;
      scene = body.scene;
      goal = body.goal;
      shortAdvice = body.short_advice;
      
      console.log('Parsed parameters:', {
        theoryId,
        theoryName,
        theoryNameJa,
        adviceContext,
        scene,
        goal,
        shortAdvice
      });
    } else {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // アドバイスのコンテキストがある場合は、関連理論をAIで探す
    if (adviceContext || scene || goal || shortAdvice) {
      console.log('Searching for related theories based on advice context:', {
        adviceContext,
        scene,
        goal,
        shortAdvice
      });

      const contextPrompt = `あなたは組織変革とリーダーシップの理論の専門家です。
以下のアドバイスのコンテキストに基づいて、最も関連性の高い理論を3つ選び、それぞれについて詳細な説明を提供してください。

**アドバイスのコンテキスト:**
- シーン: ${scene || '未指定'}
- 目標: ${goal || '未指定'}
- アドバイス内容: ${shortAdvice || '未指定'}
- 詳細コンテキスト: ${adviceContext || '未指定'}

以下の形式でJSONで返してください：
{
  "related_theories": [
    {
      "id": "theory_1",
      "name": "理論1の日本語名",
      "description": "理論1の詳細な説明（200文字程度）",
      "relevance": "このアドバイスとの関連性（100文字程度）",
      "academic_field": "行動経済学",
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
      ],
      "practical_tips": [
        "実践のコツ1（80文字程度）",
        "実践のコツ2（80文字程度）"
      ]
    },
    {
      "id": "theory_2",
      "name": "理論2の日本語名",
      "description": "理論2の詳細な説明（200文字程度）",
      "relevance": "このアドバイスとの関連性（100文字程度）",
      "academic_field": "組織心理学",
      "key_concepts": [...],
      "when_to_use": [...],
      "examples": [...],
      "practical_tips": [...]
    },
    {
      "id": "theory_3",
      "name": "理論3の日本語名",
      "description": "理論3の詳細な説明（200文字程度）",
      "relevance": "このアドバイスとの関連性（100文字程度）",
      "academic_field": "リーダーシップ論",
      "key_concepts": [...],
      "when_to_use": [...],
      "examples": [...],
      "practical_tips": [...]
    }
  ],
  "summary": "これらの理論を組み合わせることで、アドバイスの効果を最大化できる理由（150文字程度）"
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
              content: "あなたは組織変革とリーダーシップの理論の専門家です。アドバイスのコンテキストに基づいて、最も関連性の高い理論を選び、実践的で具体的な説明を提供してください。"
            },
            {
              role: "user",
              content: contextPrompt
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
      
      const aiTheories = JSON.parse(jsonMatch[0])

      return new Response(JSON.stringify(aiTheories), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 特定の理論IDが指定されている場合の処理（従来の機能）
    if (theoryId) {
      const sb = adminClient()
      
      // まずデータベースから理論を検索
      const { data: dbTheory, error: dbError } = await sb.from("theories").select("*").eq("id", theoryId).single()
      
      if (dbTheory && !dbError) {
        // データベースに理論が存在する場合
        const card: TheoryCard = {
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
    }

    // パラメータが不足している場合
    return new Response("Insufficient parameters. Please provide either theory ID or advice context.", { 
      status: 400, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Theory function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})