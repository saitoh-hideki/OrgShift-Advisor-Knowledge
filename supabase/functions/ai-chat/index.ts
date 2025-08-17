// AIチャット機能のエッジファンクション
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { adminClient, diagnoseEnvironment } from "../_shared/client.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string;
  context?: {
    scene: string;
    goal: string;
    currentAdvice?: any;
    currentTheory?: any;
  };
  chatHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 環境変数の診断
    const envDiagnosis = diagnoseEnvironment();
    console.log('Environment diagnosis:', envDiagnosis);
    
    console.log('AI Chat function called with method:', req.method);
    
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const body: ChatRequest = await req.json();
    console.log('Request body:', body);
    
    const { message, context, chatHistory } = body;
    
    if (!message) {
      return new Response('Message is required', { 
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

    // OpenAI APIを使用してAI回答を生成
    let aiResponse = '';
    try {
      aiResponse = await generateAIResponse(message, context, chatHistory);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      // AI生成に失敗した場合のフォールバック回答
      aiResponse = generateFallbackResponse(message, context);
    }

    // チャット履歴をデータベースに保存（オプション）
    try {
      await supabase
        .from("chat_history")
        .insert({
          user_message: message,
          ai_response: aiResponse,
          context: JSON.stringify(context),
          timestamp: new Date().toISOString()
        });
    } catch (saveError) {
      console.log('Failed to save chat history:', saveError);
      // チャット履歴の保存に失敗しても処理は続行
    }

    console.log('Generated AI response:', aiResponse);
    
    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('AI Chat function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// OpenAI APIを使用してAI回答を生成
async function generateAIResponse(message: string, context: any, chatHistory?: Array<{role: string, content: string}>): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  
  if (!openaiApiKey) {
    console.error("OpenAI API key not configured");
    throw new Error("OpenAI API key not configured")
  }

  try {
    // システムプロンプトの構築
    let systemPrompt = `あなたは気軽に相談できるビジネスアドバイザーです。ユーザーの質問に対して、以下の点を心がけて簡潔で実用的な回答を提供してください：

1. **簡潔性**: 1つの核心的なポイントに絞って回答する
2. **実用性**: すぐに実行できる具体的なアドバイスを提供する
3. **親しみやすさ**: 堅苦しくなく、気軽に相談できる雰囲気で回答する
4. **現在の状況を活かす**: ユーザーの現在のシーンや目標を考慮した回答

現在のコンテキスト：
- シーン: ${context?.scene || 'ビジネス'}
- 目標: ${context?.goal || '効果的なコミュニケーション'}`;

    if (context?.currentTheory) {
      systemPrompt += `\n- 関連理論: ${context.currentTheory.name_ja || context.currentTheory.name} - ${context.currentTheory.one_liner || context.currentTheory.definition}`;
    }

    if (context?.currentAdvice) {
      systemPrompt += `\n- 関連アドバイス: ${context.currentAdvice.short_advice}`;
    }

    systemPrompt += `\n\nユーザーの質問に対して、このコンテキストを活かして具体的で実用的な回答を提供してください。`;

    // チャット履歴を含むメッセージの構築
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // チャット履歴を追加（最新の5件まで）
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-5);
      for (const entry of recentHistory) {
        messages.push({
          role: entry.role as "user" | "assistant",
          content: entry.content
        });
      }
    }

    // 現在のユーザーメッセージを追加
    messages.push({
      role: "user",
      content: message
    });

    console.log("Calling OpenAI API with messages:", messages.length);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    console.log("OpenAI response received, content length:", content.length);
    
    return content;
  } catch (error) {
    console.error("AI generation error:", error)
    throw error
  }
}

// フォールバック用の回答生成（AI生成に失敗した場合）
function generateFallbackResponse(message: string, context: any): string {
  const messageLower = message.toLowerCase();
  
  // 基本的なキーワードマッチングによるフォールバック
  if (messageLower.includes('実践') || messageLower.includes('使い方') || messageLower.includes('how')) {
    return `実践方法についてお答えします。

現在のシーン「${context?.scene || 'ビジネス'}」、目標「${context?.goal || '効果的なコミュニケーション'}」を考慮すると、以下のポイントが重要です：

1. **状況の正確な把握**: 現在の状況と課題を整理する
2. **段階的なアプローチ**: 小さな改善から始めて、徐々に発展させる
3. **継続的な評価**: 効果を定期的に確認し、必要に応じて調整する

より具体的なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  if (messageLower.includes('例') || messageLower.includes('具体例') || messageLower.includes('example')) {
    return `具体例についてお答えします。

シーン「${context?.scene || 'ビジネス'}」、目標「${context?.goal || '効果的なコミュニケーション'}」の場面では、以下のような具体例が考えられます：

1. **日常的なコミュニケーション**: 会議での発言、1on1での対話
2. **課題解決**: 問題の分析、解決策の提案
3. **関係構築**: チームメンバーとの信頼関係の構築

より詳細で具体的な例が必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  // デフォルトのフォールバック回答
  return `申し訳ございません。現在AIチャットの応答生成に問題が発生しております。

シーン「${context?.scene || 'ビジネス'}」、目標「${context?.goal || '効果的なコミュニケーション'}」について、基本的なアドバイスとしては：

1. **状況の理解**: 現在の状況を正確に把握する
2. **目標の明確化**: 達成したい目標を具体的に設定する
3. **段階的なアプローチ**: 小さな改善から始める
4. **継続的な学習**: 効果を確認しながら改善する

より詳細で個別化されたアドバイスが必要でしたら、しばらく時間をおいて再度お試しください。`;
}
