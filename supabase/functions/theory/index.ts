// アドバイスに関連する理論をデータベースから選択して表示する機能
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  advice_id?: string; // アドバイスIDを追加
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
  academic_field?: string;
}

// アドバイス内容に基づいて理論を選択する関数
async function selectTheoriesForAdvice(
  adviceContext: string, 
  scene: string, 
  goal: string, 
  shortAdvice: string,
  adviceId?: string
): Promise<any> {
  // Supabaseクライアントを作成（認証なし）
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://eqiqthlfjcbyqfudziar.supabase.co'
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXF0aGxmamNieXFmdWR6aWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
  
  const sb = createClient(supabaseUrl, supabaseAnonKey)
  
  // アドバイスIDがある場合は、それに基づいて理論を選択
  if (adviceId) {
    console.log('Selecting theories based on advice ID:', adviceId);
    
    // アドバイスIDのハッシュ値を使用して理論を選択（一貫性を保つ）
    const hash = simpleHash(adviceId);
    const selectedTheories = await selectTheoriesByHash(hash, sb);
    
    return {
      related_theories: selectedTheories,
      summary: `アドバイスID ${adviceId} に基づいて選択された理論です。これらの理論を組み合わせることで、アドバイスの効果を最大化できます。`,
      selection_method: "advice_id_based"
    };
  }
  
  // アドバイス内容に基づいて理論を選択
  console.log('Selecting theories based on advice content');
  
  // シーンと目標に基づいて理論ドメインを決定
  const domain = determineDomainByScene(scene, goal);
  
  // アドバイス内容のキーワードを抽出
  const keywords = extractKeywords(shortAdvice, adviceContext);
  
  // 理論を選択
  const selectedTheories = await selectTheoriesByContent(domain, keywords, sb);
  
  return {
    related_theories: selectedTheories,
    summary: `シーン「${scene}」と目標「${goal}」に基づいて選択された理論です。アドバイス内容「${shortAdvice}」に関連する理論を組み合わせることで、効果を最大化できます。`,
    selection_method: "content_based"
  };
}

// アドバイスIDのハッシュ値を使用して理論を選択（一貫性を保つ）
async function selectTheoriesByHash(hash: number, sb: any): Promise<any[]> {
  // ハッシュ値に基づいて理論を選択
  const { data: theories, error } = await sb
    .from("theories")
    .select("*")
    .limit(100);
  
  if (error || !theories) {
    console.error('Error fetching theories:', error);
    return [];
  }
  
  // ハッシュ値を使用して理論を選択（一貫性を保つ）
  const selectedIndices = [
    hash % theories.length,
    (hash * 2) % theories.length,
    (hash * 3) % theories.length
  ];
  
  const selectedTheories = selectedIndices.map(index => {
    const theory = theories[index];
    return {
      id: theory.id,
      name: theory.name_ja || theory.name_en,
      description: theory.definition || theory.content || theory.one_liner,
      relevance: `${theory.academic_field}の観点から、このアドバイスの実践を支援します`,
      academic_field: theory.academic_field,
      key_concepts: theory.key_concepts || [],
      when_to_use: theory.applicable_scenarios ? [theory.applicable_scenarios] : [],
      examples: theory.examples || [],
      practical_tips: theory.practical_tips || []
    };
  });
  
  return selectedTheories;
}

// アドバイス内容に基づいて理論を選択
async function selectTheoriesByContent(domain: string, keywords: string[], sb: any): Promise<any[]> {
  // ドメインとキーワードに基づいて理論を検索
  let query = sb.from("theories").select("*");
  
  if (domain && domain !== 'all') {
    query = query.eq('domain', domain);
  }
  
  const { data: theories, error } = await query.limit(100);
  
  if (error || !theories) {
    console.error('Error fetching theories:', error);
    return [];
  }
  
  // キーワードマッチングでスコアを計算
  const scoredTheories = theories.map(theory => {
    let score = 0;
    const theoryText = `${theory.name_ja || ''} ${theory.name_en || ''} ${theory.definition || ''} ${theory.content || ''} ${theory.one_liner || ''}`.toLowerCase();
    
    keywords.forEach(keyword => {
      if (theoryText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    });
    
    // ドメインマッチでボーナス
    if (theory.domain === domain) {
      score += 2;
    }
    
    return { theory, score };
  });
  
  // スコア順にソート
  scoredTheories.sort((a, b) => b.score - a.score);
  
  // 上位3つの理論を選択
  const selectedTheories = scoredTheories.slice(0, 3).map(({ theory }) => ({
    id: theory.id,
    name: theory.name_ja || theory.name_en,
    description: theory.definition || theory.content || theory.one_liner,
    relevance: `${theory.academic_field || '理論'}の観点から、このアドバイスの実践を支援します`,
    academic_field: theory.academic_field,
    key_concepts: theory.key_concepts || [],
    when_to_use: theory.applicable_scenarios ? [theory.applicable_scenarios] : [],
    examples: theory.examples || [],
    practical_tips: theory.practical_tips || []
  }));
  
  return selectedTheories;
}

// シーンと目標に基づいて理論ドメインを決定
function determineDomainByScene(scene: string, goal: string): string {
  const sceneDomainMap: { [key: string]: string } = {
    'meeting': 'operations',
    'sales': 'communication',
    'presentation': 'communication',
    'interview': 'leadership',
    'team_building': 'leadership'
  };
  
  const goalDomainMap: { [key: string]: string } = {
    'decide': 'leadership',
    'persuade': 'communication',
    'improve': 'operations',
    'innovate': 'innovation',
    'optimize': 'finance'
  };
  
  return sceneDomainMap[scene] || goalDomainMap[goal] || 'all';
}

// アドバイス内容からキーワードを抽出
function extractKeywords(shortAdvice: string, adviceContext: string): string[] {
  const text = `${shortAdvice} ${adviceContext}`;
  const keywords = [
    '会議', '営業', 'プレゼン', '面談', 'チーム', 'リーダー', 'コミュニケーション',
    '効率', '改善', '革新', '戦略', '交渉', '影響力', '心理', '行動',
    '品質', 'プロセス', '顧客', '価値', '収益', '投資', 'リスク', '成長'
  ];
  
  return keywords.filter(keyword => text.includes(keyword));
}

// 簡単なハッシュ関数
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32ビット整数に変換
  }
  return Math.abs(hash);
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
    let adviceId: string | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url)
      theoryId = url.searchParams.get("id") || undefined;
      theoryName = url.searchParams.get("name") || undefined;
      theoryNameJa = url.searchParams.get("name_ja") || undefined;
      adviceContext = url.searchParams.get("advice_context") || undefined;
      scene = url.searchParams.get("scene") || undefined;
      goal = url.searchParams.get("goal") || undefined;
      shortAdvice = url.searchParams.get("short_advice") || undefined;
      adviceId = url.searchParams.get("advice_id") || undefined;
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
      adviceId = body.advice_id;
      
      console.log('Parsed parameters:', {
        theoryId,
        theoryName,
        theoryNameJa,
        adviceContext,
        scene,
        goal,
        shortAdvice,
        adviceId
      });
    } else {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    // アドバイスのコンテキストがある場合は、データベースから関連理論を選択
    if (adviceContext || scene || goal || shortAdvice || adviceId) {
      console.log('Selecting related theories based on advice context:', {
        adviceContext,
        scene,
        goal,
        shortAdvice,
        adviceId
      });

      try {
        const theories = await selectTheoriesForAdvice(
          adviceContext || '', 
          scene || '', 
          goal || '', 
          shortAdvice || '',
          adviceId
        );

        return new Response(JSON.stringify(theories), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error selecting theories:', error);
        // エラーが発生した場合は、フォールバックとしてAI生成を使用
        return await generateTheoriesWithAI(adviceContext, scene, goal, shortAdvice);
      }
    }

    // 特定の理論IDが指定されている場合の処理（従来の機能）
    if (theoryId) {
      // Supabaseクライアントを作成（認証なし）
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://eqiqthlfjcbyqfudziar.supabase.co'
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXF0aGxmamNieXFmdWR6aWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
      
      const sb = createClient(supabaseUrl, supabaseAnonKey)
      
      // まずデータベースから理論を検索
      const { data: dbTheory, error: dbError } = await sb.from("theories").select("*").eq("id", theoryId).single()
      
      if (dbTheory && !dbError) {
        // データベースに理論が存在する場合
        const card: TheoryCard = {
          id: dbTheory.id,
          name: dbTheory.name_ja || dbTheory.name_en,
          description: dbTheory.one_liner || dbTheory.mechanism,
          key_concepts: dbTheory.how_to ? [dbTheory.how_to] : [],
          when_to_use: dbTheory.applicable_scenarios ? [dbTheory.applicable_scenarios] : [],
          examples: dbTheory.examples ? dbTheory.examples : [],
          academic_field: dbTheory.academic_field
        }
        
        return new Response(JSON.stringify(card), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // データベースに理論が存在しない場合、AIで理論を生成
      return await generateTheoryWithAI(theoryId, theoryNameJa || theoryName);
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

// AIで理論を生成する関数（フォールバック用）
async function generateTheoriesWithAI(adviceContext: string | undefined, scene: string | undefined, goal: string | undefined, shortAdvice: string | undefined): Promise<Response> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured")
  }

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

// AIで特定の理論を生成する関数
async function generateTheoryWithAI(theoryId: string, theoryName: string): Promise<Response> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured")
  }

  const prompt = `あなたは組織変革とリーダーシップの理論の専門家です。
以下の理論について、詳細で実践的な説明を提供してください。

理論名: ${theoryName}

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