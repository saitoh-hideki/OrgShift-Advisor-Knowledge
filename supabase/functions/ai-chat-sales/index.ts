// 営業特化AIチャット機能のエッジファンクション
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
    salesStage?: string;
    customerType?: string;
    productService?: string;
    salesChannel?: string;
    customerNeeds?: string;
    salesConstraints?: string;
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
    console.log('Sales AI Chat function called with method:', req.method);
    
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

    // OpenAI APIを使用して営業特化のAI回答を生成
    let aiResponse = '';
    try {
      aiResponse = await generateSalesAIResponse(message, context, chatHistory);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      // AI生成に失敗した場合のフォールバック回答
      aiResponse = generateSalesFallbackResponse(message, context);
    }

    // チャット履歴をデータベースに保存（オプション）
    try {
      const supabase = adminClient();
      await supabase
        .from("chat_history")
        .insert({
          user_message: message,
          ai_response: aiResponse,
          context: JSON.stringify(context),
          scene_type: 'sales',
          timestamp: new Date().toISOString()
        });
    } catch (saveError) {
      console.log('Failed to save chat history:', saveError);
    }

    console.log('Generated sales AI response:', aiResponse);
    
    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Sales AI Chat function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// OpenAI APIを使用して営業特化のAI回答を生成
async function generateSalesAIResponse(message: string, context: any, chatHistory?: Array<{role: string, content: string}>): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  
  if (!openaiApiKey) {
    console.error("OpenAI API key not configured");
    throw new Error("OpenAI API key not configured")
  }

  try {
    // 営業特化のシステムプロンプトの構築
    let systemPrompt = `あなたは営業とビジネス開発の専門家です。ユーザーの営業に関する質問に対して、以下の点を考慮して具体的で実践的な回答を提供してください：

1. 常に実用的で実行可能なアドバイスを提供する
2. 顧客のニーズと価値提案の最適化を促進する
3. 営業プロセスの各段階での効果的なアプローチを示す
4. 信頼関係の構築と長期的な関係性の維持を重視する
5. 具体的な例やステップを示す
6. 継続的な改善と学習を促進する

現在の営業コンテキスト：
- シーン: ${context?.scene || '営業'}
- 目標: ${context?.goal || '営業の成功'}
- 営業段階: ${context?.salesStage || '初期接触・提案・クロージング'}
- 顧客タイプ: ${context?.customerType || '新規・既存・潜在'}
- 製品・サービス: ${context?.productService || '一般的な製品・サービス'}
- 営業チャネル: ${context?.salesChannel || '直接・電話・オンライン'}
- 顧客ニーズ: ${context?.customerNeeds || '問題解決・価値向上・効率化'}
- 制約: ${context?.salesConstraints || '時間・予算・競合'}`;

    if (context?.currentTheory) {
      systemPrompt += `\n- 関連理論: ${context.currentTheory.name_ja || context.currentTheory.name} - ${context.currentTheory.one_liner || context.currentTheory.definition}`;
    }

    if (context?.currentAdvice) {
      systemPrompt += `\n- 関連アドバイス: ${context.currentAdvice.short_advice}`;
    }

    systemPrompt += `\n\nユーザーの営業に関する質問に対して、このコンテキストを活かして具体的で実用的な回答を提供してください。営業の成功に直結する実践的なアドバイスを心がけてください。`;

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

    console.log("Calling OpenAI API for sales with messages:", messages.length);
    
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
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    console.log("OpenAI sales response received, content length:", content.length);
    
    return content;
  } catch (error) {
    console.error("Sales AI generation error:", error)
    throw error
  }
}

// 営業特化のフォールバック用の回答生成（AI生成に失敗した場合）
function generateSalesFallbackResponse(message: string, context: any): string {
  const messageLower = message.toLowerCase();
  
  // 基本的なキーワードマッチングによるフォールバック
  if (messageLower.includes('顧客') || messageLower.includes('customer') || messageLower.includes('ニーズ') || messageLower.includes('needs')) {
    return `顧客ニーズの把握についてお答えします。

現在の営業コンテキストを考慮すると、以下のポイントが重要です：

**顧客タイプ**: ${context?.customerType || '新規・既存・潜在'}
**顧客ニーズ**: ${context?.customerNeeds || '問題解決・価値向上・効率化'}

**顧客ニーズ把握のポイント**:
1. 顧客の課題と問題を深く理解する
2. 顧客の目標と期待値を明確にする
3. 顧客の状況に合わせた価値提案を行う

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  if (messageLower.includes('提案') || messageLower.includes('proposal') || messageLower.includes('価値') || messageLower.includes('value')) {
    return `価値提案についてお答えします。

**価値提案のポイント**:
1. 顧客の課題に焦点を当てる
2. 具体的な解決策と効果を示す
3. 競合との差別化を明確にする

**目標「${context?.goal || '営業の成功'}」を達成するために**:
- 顧客の視点に立った提案
- 測定可能な価値の提示
- 長期的な関係性の構築

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  // デフォルトのフォールバック回答
  return `申し訳ございません。現在営業AIチャットの応答生成に問題が発生しております。

現在の営業コンテキストについて、基本的なアドバイスとしては：

1. **顧客理解**: 顧客の課題とニーズを深く把握する
2. **価値提案**: 顧客にとって具体的で魅力的な価値を提示する
3. **関係構築**: 信頼関係を基盤とした長期的な関係性を構築する
4. **継続改善**: 営業プロセスを継続的に改善し、学習する

より詳細で個別化されたアドバイスが必要でしたら、しばらく時間をおいて再度お試しください。`;
}
