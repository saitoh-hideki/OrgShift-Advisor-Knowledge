import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecentAdvicePayload {
  scene_id: string;
  goal: string;
  time_limit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  theory_id: string;
  short_advice: string;
  expected_effect: string;
  caution?: string;
  tips?: string;
  related_theory?: string;
  implementation_steps: string[];
  success_indicators: string[];
  common_mistakes: string[];
}

serve(async (req) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Recent-advices function called with method:', req.method);
    
    // Supabaseクライアントの作成
    let supabase;
    try {
      supabase = adminClient();
      console.log('Supabase client created successfully');
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize database connection', details: clientError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // プロトタイプ版: 認証なしで固定ユーザーIDを使用
    const prototypeUserId = '00000000-0000-0000-0000-000000000000'

    switch (req.method) {
      case 'POST':
        // 最近のアドバイスを保存
        const payload: RecentAdvicePayload = await req.json()
        console.log('Received payload:', JSON.stringify(payload, null, 2));
        
        // 既存の同じtheory_idのレコードを削除（重複防止）
        const { error: deleteExistingError } = await supabase
          .from('recent_advices')
          .delete()
          .is('user_id', null)
          .eq('theory_id', payload.theory_id)

        if (deleteExistingError) {
          console.error('Delete existing record error:', deleteExistingError);
        }

        // 新しいレコードを挿入
        const { data: newAdvice, error: insertError } = await supabase
          .from('recent_advices')
          .insert({
            user_id: null, // 外部キー制約を回避
            scene_id: payload.scene_id,
            goal: payload.goal,
            time_limit: payload.time_limit,
            stakes: payload.stakes,
            participants: payload.participants,
            relationship: payload.relationship,
            theory_id: payload.theory_id,
            short_advice: payload.short_advice,
            expected_effect: payload.expected_effect,
            caution: payload.caution,
            tips: payload.tips,
            related_theory: payload.related_theory,
            implementation_steps: payload.implementation_steps,
            success_indicators: payload.success_indicators,
            common_mistakes: payload.common_mistakes
          })
          .select()
          .single()

        if (insertError) {
          console.error('Insert error:', insertError)
          return new Response(
            JSON.stringify({ error: 'Failed to save recent advice', details: insertError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Successfully inserted new advice:', newAdvice);

        // 古いレコードを削除（最新10件のみ保持）
        const { data: allAdvices, error: fetchAllError } = await supabase
          .from('recent_advices')
          .select('id')
          .eq('user_id', prototypeUserId)
          .order('created_at', { ascending: false })

        if (fetchAllError) {
          console.error('Fetch all advices error:', fetchAllError);
        } else if (allAdvices && allAdvices.length > 10) {
          const idsToDelete = allAdvices.slice(10).map(advice => advice.id)
          const { error: cleanupError } = await supabase
            .from('recent_advices')
            .delete()
            .in('id', idsToDelete)
          
          if (cleanupError) {
            console.error('Cleanup old records error:', cleanupError);
          }
        }

        return new Response(
          JSON.stringify({ success: true, data: newAdvice }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'GET':
        // 最近のアドバイスを取得
        const { data: recentAdvices, error: fetchError } = await supabase
          .from('recent_advices')
          .select('*')
          .eq('user_id', prototypeUserId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (fetchError) {
          console.error('Fetch error:', fetchError)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch recent advices', details: fetchError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Successfully fetched recent advices:', recentAdvices?.length || 0);
        return new Response(
          JSON.stringify({ data: recentAdvices || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'DELETE':
        // 特定のアドバイスを削除
        const { id } = await req.json()
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: deleteSpecificError } = await supabase
          .from('recent_advices')
          .delete()
          .eq('id', id)
          .eq('user_id', prototypeUserId)

        if (deleteSpecificError) {
          console.error('Delete error:', deleteSpecificError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete recent advice', details: deleteSpecificError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
