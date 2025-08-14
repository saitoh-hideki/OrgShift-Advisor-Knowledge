// POST: { session_id, result: 'success'|'partial'|'fail', comment?, executed_theory_ids? }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient } from "../_shared/client.ts"

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    const body = await req.json()
    const sb = adminClient()
    
    const { error } = await sb.from("feedbacks").insert({
      session_id: body.session_id,
      result: body.result,
      comment: body.comment ?? null,
      executed_theory_ids: body.executed_theory_ids ?? []
    })
    
    if (error) return new Response(error.message, { status: 500 })
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type":"application/json", "Access-Control-Allow-Origin": "*" }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})