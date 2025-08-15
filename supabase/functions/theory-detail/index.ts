// 認証なしで理論詳細を取得するエッジファンクション
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TheoryDetailRequest {
  theory_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Theory detail function called with method:', req.method);
    
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const body: TheoryDetailRequest = await req.json();
    console.log('Request body:', body);
    
    const { theory_id } = body;
    
    if (!theory_id) {
      return new Response('Theory ID is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Supabaseクライアントを作成（認証なし）
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://eqiqthlfjcbyqfudziar.supabase.co'
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXF0aGxmamNieXFmdWR6aWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // データベースから理論を検索
    const { data: theory, error } = await supabase
      .from("theories")
      .select("*")
      .eq("id", theory_id)
      .single()
    
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        error: 'Theory not found',
        details: error.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (!theory) {
      return new Response(JSON.stringify({ 
        error: 'Theory not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 理論データを返す
    const theoryData = {
      name_ja: theory.name_ja || theory.name_en || theory_id,
      name_en: theory.name_en || theory_id,
      academic_field: theory.academic_field || '理論',
      one_liner: theory.one_liner || theory.definition || '理論の概要',
      definition: theory.definition || theory.content || '理論の定義',
      content: theory.content || theory.definition || '理論の詳細内容',
      applicable_scenarios: theory.applicable_scenarios || [],
      key_concepts: theory.key_concepts || [],
      practical_tips: theory.practical_tips || [],
      examples: theory.examples || [],
      mechanism: theory.mechanism || '',
      how_to: theory.how_to || '',
      templates: theory.templates || []
    }
    
    console.log('Returning theory data:', theoryData);
    
    return new Response(JSON.stringify(theoryData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Theory detail function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
