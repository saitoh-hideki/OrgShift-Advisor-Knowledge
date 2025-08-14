export const runtime = 'edge'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const res = await fetch(`${url}/rest/v1/sessions?select=id,created_at`, {
    headers: { 
      apikey: key, 
      Authorization: `Bearer ${key}` 
    }
  })
  
  const sessions = await res.json()
  
  return new Response(JSON.stringify({ 
    count: sessions.length,
    latest: sessions[0]?.created_at || null
  }), {
    headers: { "Content-Type":"application/json" }
  })
}