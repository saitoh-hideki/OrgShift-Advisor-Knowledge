import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // リクエストボディを取得
    const { scene, goal, short_advice, advice_context, advice_id } = await req.json()

    // 必須パラメータのチェック
    if (!scene || !goal || !short_advice) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: scene, goal, short_advice' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Supabaseクライアントを作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // アドバイスの内容を詳細に解析
    console.log('Analyzing advice for theories:', {
      scene,
      goal, 
      short_advice,
      advice_context,
      advice_id
    })

    // シーンと目標に基づいて理論ドメインとカテゴリーを特定
    let targetDomains = []
    let targetCategories = []
    if (scene.includes('面談') || scene.includes('interview')) {
      targetDomains = ['behavioral_econ', 'communication', 'leadership_org_psychology']
      targetCategories = ['behavioral_economics', 'communication_sales', 'leadership_org_psychology']
    } else if (scene.includes('プレゼン') || scene.includes('presentation')) {
      targetDomains = ['communication', 'innovation_product', 'strategy']
      targetCategories = ['communication_sales', 'innovation_product', 'strategy']
    } else if (scene.includes('会議') || scene.includes('meeting')) {
      targetDomains = ['leadership_org_psychology', 'operations_project_management', 'communication']
      targetCategories = ['leadership_org_psychology', 'operations_project_management', 'communication_sales']
    } else if (scene.includes('営業') || scene.includes('sales')) {
      targetDomains = ['communication', 'behavioral_econ', 'negotiation_influence']
      targetCategories = ['communication_sales', 'behavioral_economics', 'negotiation_influence']
    } else if (scene.includes('チーム構築') || scene.includes('team')) {
      targetDomains = ['leadership_org_psychology', 'operations_project_management', 'strategy']
      targetCategories = ['leadership_org_psychology', 'operations_project_management', 'strategy']
    }

    // 目標に基づいて理論の優先度を調整
    let priorityKeywords = []
    if (goal.includes('効率') || goal.includes('改善')) {
      priorityKeywords = ['効率化', '改善', '最適化', 'プロセス']
    } else if (goal.includes('売上') || goal.includes('利益')) {
      priorityKeywords = ['売上向上', '利益最大化', '収益', '成長']
    } else if (goal.includes('関係') || goal.includes('信頼')) {
      priorityKeywords = ['関係構築', '信頼', 'コミュニケーション', '協力']
    } else if (goal.includes('革新') || goal.includes('創造')) {
      priorityKeywords = ['イノベーション', '創造性', '新規性', '発想']
    }

    // アドバイスの内容からキーワードを抽出
    const adviceKeywords = short_advice.split(/[、。\s]+/).filter(word => word.length > 1)
    
    // 理論検索クエリを構築
    const searchQuery = `${scene} ${goal} ${short_advice} ${advice_context || ''}`
    console.log('Search query:', searchQuery)
    console.log('Target domains:', targetDomains)
    console.log('Target categories:', targetCategories)
    console.log('Priority keywords:', priorityKeywords)

    // ドメインとカテゴリー別に理論を検索
    let allTheories = []
    
    if (targetDomains.length > 0) {
      // 特定ドメインから理論を取得
      for (const domain of targetDomains) {
        const { data: domainTheories, error } = await supabase
          .from('theories')
          .select('*')
          .eq('domain', domain)
          .limit(15) // 各ドメインからより多くの理論を取得
        
        if (!error && domainTheories) {
          allTheories.push(...domainTheories)
        }
      }
      
      // 特定カテゴリーから理論を取得
      for (const category of targetCategories) {
        const { data: categoryTheories, error } = await supabase
          .from('theories')
          .select('*')
          .eq('category', category)
          .limit(15) // 各カテゴリーからより多くの理論を取得
        
        if (!error && categoryTheories) {
          allTheories.push(...categoryTheories)
        }
      }
    } else {
      // 全ドメインから理論を取得
      const { data: theories, error } = await supabase
        .from('theories')
        .select('*')
        .limit(50) // より多くの理論を取得
      
      if (!error && theories) {
        allTheories = theories
      }
    }

    // 理論が不足している場合は、全理論を取得
    if (allTheories.length < 3) {
      console.log('Not enough theories found, fetching all theories...')
      const { data: allTheoriesData, error } = await supabase
        .from('theories')
        .select('*')
        .limit(100)
      
      if (!error && allTheoriesData) {
        allTheories = allTheoriesData
      }
    }

    if (allTheories.length === 0) {
      throw new Error('No theories found in database')
    }

    console.log(`Found ${allTheories.length} theories to analyze`)

    // 理論の関連性スコアを計算
    const scoredTheories = allTheories.map(theory => {
      let score = 0
      
      // ドメインマッチング
      if (targetDomains.includes(theory.domain)) {
        score += 10
      }
      
      // カテゴリーマッチング
      if (theory.category && targetCategories.includes(theory.category)) {
        score += 10
      }
      
      // キーワードマッチング
      const theoryText = `${theory.name_ja} ${theory.definition || ''} ${theory.content || ''} ${theory.one_liner || ''}`
      for (const keyword of priorityKeywords) {
        if (theoryText.includes(keyword)) {
          score += 5
        }
      }
      
      // アドバイス内容との関連性
      for (const keyword of adviceKeywords) {
        if (theoryText.includes(keyword)) {
          score += 3
        }
      }
      
      // シーン・目標との関連性
      if (theoryText.includes(scene) || theoryText.includes(goal)) {
        score += 2
      }
      
      // タグとの関連性
      if (theory.tags && Array.isArray(theory.tags)) {
        for (const tag of theory.tags) {
          if (scene.includes(tag) || goal.includes(tag)) {
            score += 3
          }
        }
      }
      
      return { ...theory, relevanceScore: score }
    })

    // スコア順にソートして上位3件を選択
    let topTheories = scoredTheories
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)

    // 理論が3個未満の場合は、スコアに関係なく上位3個を選択
    if (topTheories.length < 3) {
      console.log(`Only ${topTheories.length} theories found, adding more theories...`)
      const remainingTheories = scoredTheories
        .filter(theory => !topTheories.some(top => top.id === theory.id))
        .slice(0, 3 - topTheories.length)
      
      topTheories = [...topTheories, ...remainingTheories]
      console.log(`Added ${remainingTheories.length} more theories, total: ${topTheories.length}`)
    }

    // それでも3個未満の場合は、全理論からランダムに選択
    if (topTheories.length < 3) {
      console.log(`Still only ${topTheories.length} theories, selecting randomly from all theories...`)
      const randomTheories = allTheories
        .filter(theory => !topTheories.some(top => top.id === theory.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - topTheories.length)
      
      topTheories = [...topTheories, ...randomTheories]
      console.log(`Added ${randomTheories.length} random theories, total: ${topTheories.length}`)
    }

    console.log('Final selected theories with scores:', topTheories.map(t => ({
      name: t.name_ja,
      domain: t.domain,
      category: t.category,
      score: t.relevanceScore || 0
    })))

    // 選択された理論を適切な形式で返す
    const formattedTheories = topTheories.map(theory => ({
      id: theory.id,
      name: theory.name_ja,
      description: theory.one_liner || theory.definition || '理論の説明',
      academic_field: theory.academic_field || '理論',
      domain: theory.domain,
      category: theory.category,
      relevance_score: theory.relevanceScore,
      key_concepts: theory.key_concepts || [],
      when_to_use: theory.applicable_scenarios || [],
      examples: theory.examples || [],
      practical_tips: theory.practical_tips || []
    }))

    return new Response(
      JSON.stringify({
        related_theories: formattedTheories,
        summary: `${scene}の${goal}に関する最適な理論を3つ選定しました`,
        search_query: searchQuery,
        advice_id: advice_id,
        selection_logic: {
          target_domains: targetDomains,
          target_categories: targetCategories,
          priority_keywords: priorityKeywords,
          total_candidates: allTheories.length,
          selection_criteria: 'ドメイン、カテゴリー、キーワード、関連性スコアに基づく選定'
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
