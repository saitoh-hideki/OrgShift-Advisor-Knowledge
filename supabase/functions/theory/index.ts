// アドバイスに関連する理論をデータベースから選択して表示する機能
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

// アドバイス内容を詳細分析して理論を選択する関数
async function selectTheoriesForAdvice(
  adviceContext: string, 
  scene: string, 
  goal: string, 
  shortAdvice: string,
  adviceId?: string
): Promise<any> {
  // Supabaseクライアントを作成
  let sb;
  try {
    sb = adminClient();
    console.log('Supabase client created successfully');
  } catch (clientError) {
    console.error('Failed to create Supabase client:', clientError);
    throw new Error('Failed to initialize database connection');
  }
  
  console.log('Analyzing advice content for theory selection...');
  console.log('Scene:', scene);
  console.log('Goal:', goal);
  console.log('Short Advice:', shortAdvice);
  console.log('Advice Context:', adviceContext);
  
  // アドバイス内容の詳細分析
  const analysis = analyzeAdviceContent(shortAdvice, adviceContext, scene, goal);
  console.log('Advice analysis result:', analysis);
  
  // 分析結果に基づいて理論を選択
  const selectedTheories = await selectTheoriesByAnalysis(analysis, sb);
  
  return {
    related_theories: selectedTheories,
    summary: `アドバイス「${shortAdvice}」の内容を詳細分析し、最も関連性の高い理論を選択しました。`,
    selection_method: "content_analysis_based",
    analysis_summary: analysis
  };
}

// アドバイス内容の詳細分析
function analyzeAdviceContent(shortAdvice: string, context: string, scene: string, goal: string) {
  const analysis: {
    primary_intent: string;
    communication_style: string;
    leadership_aspects: string[];
    psychological_factors: string[];
    practical_approaches: string[];
    keywords: string[];
    complexity_level: string;
    urgency_level: string;
    target_audience: string;
    success_metrics: string[];
  } = {
    primary_intent: '',           // 主要な意図
    communication_style: '',      // コミュニケーションスタイル
    leadership_aspects: [],       // リーダーシップ要素
    psychological_factors: [],    // 心理的要素
    practical_approaches: [],     // 実践的アプローチ
    keywords: [],                 // 重要なキーワード
    complexity_level: '',         // 複雑さレベル
    urgency_level: '',           // 緊急度レベル
    target_audience: '',         // 対象者
    success_metrics: []           // 成功指標
  };
  
  // アドバイステキストの詳細分析
  const fullText = `${shortAdvice} ${context}`.toLowerCase();
  
  // 主要な意図の特定
  if (fullText.includes('説得') || fullText.includes('persuade') || fullText.includes('convince')) {
    analysis.primary_intent = 'persuasion';
  } else if (fullText.includes('合意') || fullText.includes('consensus') || fullText.includes('agreement')) {
    analysis.primary_intent = 'consensus_building';
  } else if (fullText.includes('改善') || fullText.includes('improve') || fullText.includes('enhance')) {
    analysis.primary_intent = 'improvement';
  } else if (fullText.includes('解決') || fullText.includes('solve') || fullText.includes('resolve')) {
    analysis.primary_intent = 'problem_solving';
  } else if (fullText.includes('動機') || fullText.includes('motivate') || fullText.includes('inspire')) {
    analysis.primary_intent = 'motivation';
  } else {
    analysis.primary_intent = 'general_guidance';
  }
  
  // コミュニケーションスタイルの特定
  if (fullText.includes('積極的') || fullText.includes('assertive') || fullText.includes('direct')) {
    analysis.communication_style = 'assertive';
  } else if (fullText.includes('共感的') || fullText.includes('empathetic') || fullText.includes('understanding')) {
    analysis.communication_style = 'empathetic';
  } else if (fullText.includes('論理的') || fullText.includes('logical') || fullText.includes('rational')) {
    analysis.communication_style = 'logical';
  } else if (fullText.includes('創造的') || fullText.includes('creative') || fullText.includes('innovative')) {
    analysis.communication_style = 'creative';
  } else {
    analysis.communication_style = 'balanced';
  }
  
  // リーダーシップ要素の抽出
  if (fullText.includes('リーダー') || fullText.includes('leader') || fullText.includes('指導')) {
    analysis.leadership_aspects.push('leadership');
  }
  if (fullText.includes('チーム') || fullText.includes('team') || fullText.includes('協力')) {
    analysis.leadership_aspects.push('team_management');
  }
  if (fullText.includes('部下') || fullText.includes('subordinate') || fullText.includes('育成')) {
    analysis.leadership_aspects.push('mentoring');
  }
  if (fullText.includes('意思決定') || fullText.includes('decision') || fullText.includes('判断')) {
    analysis.leadership_aspects.push('decision_making');
  }
  
  // 心理的要素の抽出
  if (fullText.includes('感情') || fullText.includes('emotion') || fullText.includes('気持ち')) {
    analysis.psychological_factors.push('emotional_intelligence');
  }
  if (fullText.includes('信頼') || fullText.includes('trust') || fullText.includes('関係')) {
    analysis.psychological_factors.push('relationship_building');
  }
  if (fullText.includes('動機') || fullText.includes('motivation') || fullText.includes('やる気')) {
    analysis.psychological_factors.push('motivation');
  }
  if (fullText.includes('ストレス') || fullText.includes('stress') || fullText.includes('プレッシャー')) {
    analysis.psychological_factors.push('stress_management');
  }
  
  // 実践的アプローチの抽出
  if (fullText.includes('ステップ') || fullText.includes('step') || fullText.includes('手順')) {
    analysis.practical_approaches.push('step_by_step');
  }
  if (fullText.includes('練習') || fullText.includes('practice') || fullText.includes('訓練')) {
    analysis.practical_approaches.push('practice_based');
  }
  if (fullText.includes('フィードバック') || fullText.includes('feedback') || fullText.includes('評価')) {
    analysis.practical_approaches.push('feedback_loop');
  }
  if (fullText.includes('実験') || fullText.includes('experiment') || fullText.includes('試行')) {
    analysis.practical_approaches.push('experimental');
  }
  
  // キーワード抽出
  const commonKeywords = ['コミュニケーション', 'リーダーシップ', 'チーム', '改善', '解決', '効果', '成功', '目標', '計画', '実行'];
  analysis.keywords = commonKeywords.filter(keyword => fullText.includes(keyword));
  
  // 複雑さレベルの判定
  if (fullText.includes('複雑') || fullText.includes('complex') || fullText.includes('難しい')) {
    analysis.complexity_level = 'high';
  } else if (fullText.includes('簡単') || fullText.includes('simple') || fullText.includes('基本的')) {
    analysis.complexity_level = 'low';
  } else {
    analysis.complexity_level = 'medium';
  }
  
  // 緊急度レベルの判定
  if (fullText.includes('緊急') || fullText.includes('urgent') || fullText.includes('すぐ')) {
    analysis.urgency_level = 'high';
  } else if (fullText.includes('長期的') || fullText.includes('long_term') || fullText.includes('ゆっくり')) {
    analysis.urgency_level = 'low';
  } else {
    analysis.urgency_level = 'medium';
  }
  
  // 対象者の特定
  if (fullText.includes('部下') || fullText.includes('subordinate')) {
    analysis.target_audience = 'subordinates';
  } else if (fullText.includes('同僚') || fullText.includes('colleague') || fullText.includes('チーム')) {
    analysis.target_audience = 'peers';
  } else if (fullText.includes('上司') || fullText.includes('superior') || fullText.includes('経営陣')) {
    analysis.target_audience = 'superiors';
  } else if (fullText.includes('顧客') || fullText.includes('customer') || fullText.includes('クライアント')) {
    analysis.target_audience = 'customers';
  } else {
    analysis.target_audience = 'general';
  }
  
  // 成功指標の抽出
  if (fullText.includes('効果') || fullText.includes('effect') || fullText.includes('結果')) {
    analysis.success_metrics.push('effectiveness');
  }
  if (fullText.includes('効率') || fullText.includes('efficiency') || fullText.includes('生産性')) {
    analysis.success_metrics.push('efficiency');
  }
  if (fullText.includes('満足') || fullText.includes('satisfaction') || fullText.includes('評価')) {
    analysis.success_metrics.push('satisfaction');
  }
  if (fullText.includes('成長') || fullText.includes('growth') || fullText.includes('発展')) {
    analysis.success_metrics.push('growth');
  }
  
  return analysis;
}

// 分析結果に基づいて理論を選択
async function selectTheoriesByAnalysis(analysis: any, sb: any): Promise<any[]> {
  console.log('Selecting theories based on detailed analysis...');
  
  // 全理論を取得
  const { data: allTheories, error } = await sb
    .from("theories")
    .select("*")
    .limit(200); // より多くの理論を取得
  
  if (error || !allTheories) {
    console.error('Error fetching theories:', error);
    return [];
  }
  
  // 各理論にスコアを付与
  const scoredTheories = allTheories.map(theory => {
    let totalScore = 0;
    const theoryText = `${theory.name_ja || ''} ${theory.name_en || ''} ${theory.definition || ''} ${theory.content || ''} ${theory.one_liner || ''}`.toLowerCase();
    
    // 主要意図とのマッチング
    if (analysis.primary_intent === 'persuasion' && 
        (theoryText.includes('説得') || theoryText.includes('persuasion') || theoryText.includes('影響力'))) {
      totalScore += 10;
    }
    if (analysis.primary_intent === 'consensus_building' && 
        (theoryText.includes('合意') || theoryText.includes('consensus') || theoryText.includes('合意形成'))) {
      totalScore += 10;
    }
    if (analysis.primary_intent === 'improvement' && 
        (theoryText.includes('改善') || theoryText.includes('improvement') || theoryText.includes('最適化'))) {
      totalScore += 10;
    }
    if (analysis.primary_intent === 'problem_solving' && 
        (theoryText.includes('解決') || theoryText.includes('problem') || theoryText.includes('課題'))) {
      totalScore += 10;
    }
    if (analysis.primary_intent === 'motivation' && 
        (theoryText.includes('動機') || theoryText.includes('motivation') || theoryText.includes('インセンティブ'))) {
      totalScore += 10;
    }
    
    // コミュニケーションスタイルとのマッチング
    if (analysis.communication_style === 'assertive' && 
        (theoryText.includes('積極的') || theoryText.includes('assertive') || theoryText.includes('直接'))) {
      totalScore += 8;
    }
    if (analysis.communication_style === 'empathetic' && 
        (theoryText.includes('共感') || theoryText.includes('empathy') || theoryText.includes('理解'))) {
      totalScore += 8;
    }
    if (analysis.communication_style === 'logical' && 
        (theoryText.includes('論理') || theoryText.includes('logical') || theoryText.includes('理性'))) {
      totalScore += 8;
    }
    if (analysis.communication_style === 'creative' && 
        (theoryText.includes('創造') || theoryText.includes('creative') || theoryText.includes('革新'))) {
      totalScore += 8;
    }
    
    // リーダーシップ要素とのマッチング
    analysis.leadership_aspects.forEach(aspect => {
      if (aspect === 'leadership' && theoryText.includes('リーダーシップ')) totalScore += 7;
      if (aspect === 'team_management' && theoryText.includes('チーム')) totalScore += 7;
      if (aspect === 'mentoring' && theoryText.includes('育成')) totalScore += 7;
      if (aspect === 'decision_making' && theoryText.includes('意思決定')) totalScore += 7;
    });
    
    // 心理的要素とのマッチング
    analysis.psychological_factors.forEach(factor => {
      if (factor === 'emotional_intelligence' && theoryText.includes('感情')) totalScore += 6;
      if (factor === 'relationship_building' && theoryText.includes('関係')) totalScore += 6;
      if (factor === 'motivation' && theoryText.includes('動機')) totalScore += 6;
      if (factor === 'stress_management' && theoryText.includes('ストレス')) totalScore += 6;
    });
    
    // 実践的アプローチとのマッチング
    analysis.practical_approaches.forEach(approach => {
      if (approach === 'step_by_step' && theoryText.includes('ステップ')) totalScore += 5;
      if (approach === 'practice_based' && theoryText.includes('練習')) totalScore += 5;
      if (approach === 'feedback_loop' && theoryText.includes('フィードバック')) totalScore += 5;
      if (approach === 'experimental' && theoryText.includes('実験')) totalScore += 5;
    });
    
    // キーワードマッチング
    analysis.keywords.forEach(keyword => {
      if (theoryText.includes(keyword.toLowerCase())) {
        totalScore += 3;
      }
    });
    
    // 対象者とのマッチング
    if (analysis.target_audience === 'subordinates' && theoryText.includes('部下')) totalScore += 4;
    if (analysis.target_audience === 'peers' && theoryText.includes('同僚')) totalScore += 4;
    if (analysis.target_audience === 'superiors' && theoryText.includes('上司')) totalScore += 4;
    if (analysis.target_audience === 'customers' && theoryText.includes('顧客')) totalScore += 4;
    
    // 成功指標とのマッチング
    analysis.success_metrics.forEach(metric => {
      if (metric === 'effectiveness' && theoryText.includes('効果')) totalScore += 3;
      if (metric === 'efficiency' && theoryText.includes('効率')) totalScore += 3;
      if (metric === 'satisfaction' && theoryText.includes('満足')) totalScore += 3;
      if (metric === 'growth' && theoryText.includes('成長')) totalScore += 3;
    });
    
    // 複雑さレベルの調整
    if (analysis.complexity_level === 'high' && theoryText.includes('複雑')) totalScore += 2;
    if (analysis.complexity_level === 'low' && theoryText.includes('基本')) totalScore += 2;
    
    // 緊急度レベルの調整
    if (analysis.urgency_level === 'high' && theoryText.includes('緊急')) totalScore += 2;
    if (analysis.urgency_level === 'low' && theoryText.includes('長期的')) totalScore += 2;
    
    return { theory, score: totalScore };
  });
  
  // スコア順にソート
  scoredTheories.sort((a, b) => b.score - a.score);
  
  console.log('Top 5 theories by score:');
  scoredTheories.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. ${item.theory.name_ja || item.theory.name_en}: ${item.score} points`);
  });
  
  // 上位3つの理論を選択（スコアが高いもののみ）
  const selectedTheories = scoredTheories
    .filter(item => item.score >= 15) // 最低スコアの閾値
    .slice(0, 3)
    .map(({ theory, score }) => ({
      id: theory.id,
      name: theory.name_ja || theory.name_en,
      description: theory.definition || theory.content || theory.one_liner,
      relevance: `スコア: ${score}点 - ${theory.academic_field || '理論'}の観点から、このアドバイスの実践を支援します`,
      academic_field: theory.academic_field,
      key_concepts: theory.key_concepts || [],
      when_to_use: theory.applicable_scenarios ? [theory.applicable_scenarios] : [],
      examples: theory.examples || [],
      practical_tips: theory.practical_tips || [],
      selection_score: score
    }));
  
  // 十分なスコアの理論がない場合は、上位3つを選択
  if (selectedTheories.length < 3) {
    const fallbackTheories = scoredTheories.slice(0, 3).map(({ theory, score }) => ({
      id: theory.id,
      name: theory.name_ja || theory.name_en,
      description: theory.definition || theory.content || theory.one_liner,
      relevance: `スコア: ${score}点 - ${theory.academic_field || '理論'}の観点から、このアドバイスの実践を支援します`,
      academic_field: theory.academic_field,
      key_concepts: theory.key_concepts || [],
      when_to_use: theory.applicable_scenarios ? [theory.applicable_scenarios] : [],
      examples: theory.examples || [],
      practical_tips: theory.practical_tips || [],
      selection_score: score
    }));
    
    return fallbackTheories;
  }
  
  return selectedTheories;
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
      
      const sb = adminClient();
      
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