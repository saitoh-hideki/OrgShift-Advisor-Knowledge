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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://eqiqthlfjcbyqfudziar.supabase.co'
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXF0aGxmamNieXFmdWR6aWFyIiwicm9sYSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzAsImV4cCI6MjA1MDU0ODg3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // アドバイスの内容を詳細に解析
    console.log('Analyzing advice for theories:', {
      scene,
      goal, 
      short_advice,
      advice_context,
      advice_id
    })

    // シーンと目標に基づいて理論カテゴリーを特定
    let targetCategories = []
    if (scene.includes('面談') || scene.includes('interview')) {
      targetCategories = ['leadership_org_psychology', 'communication_sales', 'negotiation_influence']
    } else if (scene.includes('プレゼン') || scene.includes('presentation')) {
      targetCategories = ['communication_sales', 'innovation_product', 'strategy']
    } else if (scene.includes('会議') || scene.includes('meeting')) {
      targetCategories = ['leadership_org_psychology', 'operations_project_management', 'communication_sales']
    } else if (scene.includes('営業') || scene.includes('sales')) {
      targetCategories = ['communication_sales', 'negotiation_influence', 'behavioral_economics']
    } else if (scene.includes('チーム構築') || scene.includes('team')) {
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
    console.log('Target categories:', targetCategories)
    console.log('Priority keywords:', priorityKeywords)

    // カテゴリー別に理論を検索
    let allTheories = []
    
    if (targetCategories.length > 0) {
      // 特定カテゴリーから理論を取得
      for (const category of targetCategories) {
        const { data: categoryTheories, error } = await supabase
          .from('theories')
          .select('*')
          .eq('category', category)
          .limit(10)
        
        if (!error && categoryTheories) {
          allTheories.push(...categoryTheories)
        }
      }
    } else {
      // 全カテゴリーから理論を取得
      const { data: theories, error } = await supabase
        .from('theories')
        .select('*')
        .limit(20)
      
      if (!error && theories) {
        allTheories = theories
      }
    }

    if (allTheories.length === 0) {
      throw new Error('No theories found in database')
    }

    // 理論の関連性スコアを計算
    const scoredTheories = allTheories.map(theory => {
      let score = 0
      
      // カテゴリーマッチング
      if (targetCategories.includes(theory.category)) {
        score += 10
      }
      
      // キーワードマッチング
      const theoryText = `${theory.name_ja} ${theory.definition || ''} ${theory.content || ''}`
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
      
      return { ...theory, relevanceScore: score }
    })

    // スコア順にソートして上位3件を選択
    const topTheories = scoredTheories
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)

    console.log('Selected theories with scores:', topTheories.map(t => ({
      name: t.name_ja,
      category: t.category,
      score: t.relevanceScore
    })))

    // 選択された理論を適切な形式で返す
    const formattedTheories = topTheories.map(theory => ({
      id: theory.id,
      name: theory.name_ja,
      description: theory.one_liner || theory.definition || '理論の説明',
      academic_field: theory.academic_field || '理論',
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
          target_categories: targetCategories,
          priority_keywords: priorityKeywords,
          total_candidates: allTheories.length,
          selection_criteria: 'カテゴリー、キーワード、関連性スコアに基づく選定'
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
