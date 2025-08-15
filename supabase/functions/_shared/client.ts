// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3"

export function adminClient() {
  // クラウドバンド環境での環境変数アクセス
  const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASE_PROJECT_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  
  console.log("Environment check:", {
    url: url ? "set" : "missing",
    key: key ? "set" : "missing",
    envKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes("SUPABASE"))
  })
  
  if (!url || !key) {
    console.error("Missing environment variables:", {
      url: url ? "set" : "missing",
      key: key ? "set" : "missing"
    })
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
  }
  
  console.log("Creating Supabase client with URL:", url.substring(0, 20) + "...")
  
  try {
    const client = createClient(url, key, { 
      auth: { persistSession: false },
      global: { headers: { 'Authorization': `Bearer ${key}` } }
    })
    console.log("Supabase client created successfully")
    return client as any
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw error
  }
}

// 匿名クライアント用（認証不要の操作用）
export function anonClient() {
  const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASE_PROJECT_URL")
  const key = Deno.env.get("SUPABASE_ANON_KEY")
  
  if (!url || !key) {
    console.error("Missing environment variables for anon client:", {
      url: url ? "set" : "missing",
      key: key ? "set" : "missing"
    })
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
  }
  
  try {
    const client = createClient(url, key, { 
      auth: { persistSession: false }
    })
    console.log("Anon client created successfully")
    return client as any
  } catch (error) {
    console.error("Failed to create anon client:", error)
    throw error
  }
}

// 環境変数の診断用
export function diagnoseEnvironment() {
  const envVars = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
    SUPABASE_PROJECT_URL: Deno.env.get("SUPABASE_PROJECT_URL"),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY"),
    OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY")
  }
  
  console.log("Environment diagnosis:", envVars)
  return envVars
}