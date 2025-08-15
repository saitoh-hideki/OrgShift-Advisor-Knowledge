// 理論メモ専用のエッジファンクション
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TheoryMemoRequest {
  action: 'list' | 'get' | 'search';
  theory_id?: string;
  search_query?: string;
  domain?: string;
}

interface TheoryMemo {
  id: string;
  name_ja: string;
  name_en: string;
  domain: string;
  academic_field: string;
  one_liner: string;
  definition: string;
  content: string;
  applicable_scenarios: string;
  key_concepts: string[];
  examples: string[];
  practical_tips: string[];
  mechanism: string;
  how_to: string[];
  tags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Theory memo function called with method:', req.method);
    console.log('Request URL:', req.url);
    
    let action: string | undefined;
    let theory_id: string | undefined;
    let search_query: string | undefined;
    let domain: string | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      action = url.searchParams.get("action") || undefined;
      theory_id = url.searchParams.get("theory_id") || undefined;
      search_query = url.searchParams.get("search_query") || undefined;
      domain = url.searchParams.get("domain") || undefined;
    } else if (req.method === 'POST') {
      const body: TheoryMemoRequest = await req.json();
      console.log('POST request body:', body);
      
      action = body.action;
      theory_id = body.theory_id;
      search_query = body.search_query;
      domain = body.domain;
    } else {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }
    
    if (!action) {
      return new Response('Action is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Supabaseクライアントを作成
    let supabase;
    try {
      supabase = adminClient();
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError);
      return new Response(JSON.stringify({ 
        error: 'Failed to initialize database connection',
        details: clientError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'list':
        return await listTheories(supabase, domain);
      
      case 'get':
        if (!theory_id) {
          return new Response('Theory ID is required for get action', { 
            status: 400, 
            headers: corsHeaders 
          })
        }
        return await getTheory(supabase, theory_id);
      
      case 'search':
        if (!search_query) {
          return new Response('Search query is required for search action', { 
            status: 400, 
            headers: corsHeaders 
          })
        }
        return await searchTheories(supabase, search_query, domain);
      
      default:
        return new Response('Invalid action', { 
          status: 400, 
          headers: corsHeaders 
        })
    }

  } catch (error) {
    console.error('Theory memo function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// 理論一覧を取得
async function listTheories(supabase: any, domain?: string) {
  try {
    let query = supabase.from("theories").select("*");
    
    if (domain) {
      query = query.eq("domain", domain);
    }
    
    const { data: theories, error } = await query.order("name_ja");
    
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch theories',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!theories || theories.length === 0) {
      return new Response(JSON.stringify({
        theories: [],
        total: 0,
        domain: domain || 'all'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const theoryMemos: TheoryMemo[] = theories.map((theory: any) => ({
      id: theory.id,
      name_ja: theory.name_ja,
      name_en: theory.name_en,
      domain: theory.domain,
      academic_field: theory.academic_field,
      one_liner: theory.one_liner,
      definition: theory.definition,
      content: theory.content,
      applicable_scenarios: theory.applicable_scenarios,
      key_concepts: theory.key_concepts || [],
      examples: theory.examples || [],
      practical_tips: theory.practical_tips || [],
      mechanism: theory.mechanism,
      how_to: theory.how_to || [],
      tags: theory.tags || []
    }));
    
    return new Response(JSON.stringify({
      theories: theoryMemos,
      total: theoryMemos.length,
      domain: domain || 'all'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in listTheories:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 特定の理論を取得
async function getTheory(supabase: any, theory_id: string) {
  try {
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
    
    const theoryMemo: TheoryMemo = {
      id: theory.id,
      name_ja: theory.name_ja,
      name_en: theory.name_en,
      domain: theory.domain,
      academic_field: theory.academic_field,
      one_liner: theory.one_liner,
      definition: theory.definition,
      content: theory.content,
      applicable_scenarios: theory.applicable_scenarios,
      key_concepts: theory.key_concepts || [],
      examples: theory.examples || [],
      practical_tips: theory.practical_tips || [],
      mechanism: theory.mechanism,
      how_to: theory.how_to || [],
      tags: theory.tags || []
    };
    
    return new Response(JSON.stringify(theoryMemo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in getTheory:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 理論を検索
async function searchTheories(supabase: any, search_query: string, domain?: string) {
  try {
    let query = supabase.from("theories").select("*");
    
    // ドメインフィルター
    if (domain) {
      query = query.eq("domain", domain);
    }
    
    // 検索クエリでフィルター
    query = query.or(`name_ja.ilike.%${search_query}%,name_en.ilike.%${search_query}%,definition.ilike.%${search_query}%,content.ilike.%${search_query}%`);
    
    const { data: theories, error } = await query.order("name_ja");
    
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to search theories',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!theories || theories.length === 0) {
      return new Response(JSON.stringify({
        theories: [],
        total: 0,
        search_query,
        domain: domain || 'all'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const theoryMemos: TheoryMemo[] = theories.map((theory: any) => ({
      id: theory.id,
      name_ja: theory.name_ja,
      name_en: theory.name_en,
      domain: theory.domain,
      academic_field: theory.academic_field,
      one_liner: theory.one_liner,
      definition: theory.definition,
      content: theory.content,
      applicable_scenarios: theory.applicable_scenarios,
      key_concepts: theory.key_concepts || [],
      examples: theory.examples || [],
      practical_tips: theory.practical_tips || [],
      mechanism: theory.mechanism,
      how_to: theory.how_to || [],
      tags: theory.tags || []
    }));
    
    return new Response(JSON.stringify({
      theories: theoryMemos,
      total: theoryMemos.length,
      search_query,
      domain: domain || 'all'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in searchTheories:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
