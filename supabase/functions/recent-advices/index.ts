import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Supabaseクライアントの作成
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // プロトタイプ版: 認証なしで固定ユーザーIDを使用
    const prototypeUserId = '00000000-0000-0000-0000-000000000000'

    switch (req.method) {
      case 'POST':
        // 最近のアドバイスを保存
        const payload: RecentAdvicePayload = await req.json()
        
        // 既存の同じtheory_idのレコードを削除（重複防止）
        await supabase
          .from('recent_advices')
          .delete()
          .eq('user_id', prototypeUserId)
          .eq('theory_id', payload.theory_id)

        // 新しいレコードを挿入
        const { data: newAdvice, error: insertError } = await supabase
          .from('recent_advices')
          .insert({
            user_id: prototypeUserId,
            ...payload
          })
          .select()
          .single()

        if (insertError) {
          console.error('Insert error:', insertError)
          return new Response(
            JSON.stringify({ error: 'Failed to save recent advice' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 古いレコードを削除（最新10件のみ保持）
        const { data: allAdvices } = await supabase
          .from('recent_advices')
          .select('id')
          .eq('user_id', prototypeUserId)
          .order('created_at', { ascending: false })

        if (allAdvices && allAdvices.length > 10) {
          const idsToDelete = allAdvices.slice(10).map(advice => advice.id)
          await supabase
            .from('recent_advices')
            .delete()
            .in('id', idsToDelete)
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
            JSON.stringify({ error: 'Failed to fetch recent advices' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

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

        const { error: deleteError } = await supabase
          .from('recent_advices')
          .delete()
          .eq('id', id)
          .eq('user_id', prototypeUserId)

        if (deleteError) {
          console.error('Delete error:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete recent advice' }),
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
