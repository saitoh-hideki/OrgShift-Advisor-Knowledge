// 面談特化AIチャット機能のエッジファンクション
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
    interviewType?: string;
    interviewRelationship?: string;
    interviewPurpose?: string;
    interviewContext?: string;
    interviewOutcomes?: string;
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
    console.log('Interview AI Chat function called with method:', req.method);
    
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

    // OpenAI APIを使用して面談特化のAI回答を生成
    let aiResponse = '';
    try {
      aiResponse = await generateInterviewAIResponse(message, context, chatHistory);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      // AI生成に失敗した場合のフォールバック回答
      aiResponse = generateInterviewFallbackResponse(message, context);
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
          scene_type: 'interview',
          timestamp: new Date().toISOString()
        });
    } catch (saveError) {
      console.log('Failed to save chat history:', saveError);
    }

    console.log('Generated interview AI response:', aiResponse);
    
    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Interview AI Chat function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// OpenAI APIを使用して面談特化のAI回答を生成
async function generateInterviewAIResponse(message: string, context: any, chatHistory?: Array<{role: string, content: string}>): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  
  if (!openaiApiKey) {
    console.error("OpenAI API key not configured");
    throw new Error("OpenAI API key not configured")
  }

  try {
    // 面談特化のシステムプロンプトの構築
    let systemPrompt = `あなたは面談とコミュニケーションの専門家です。ユーザーの面談に関する質問に対して、以下の点を考慮して具体的で実践的な回答を提供してください：

1. 常に実用的で実行可能なアドバイスを提供する
2. 面談の目的と目標を明確にする
3. 相手の立場と関心事を理解する
4. 効果的なコミュニケーション手法を示す
5. 信頼関係の構築を促進する
6. 具体的な例やステップを示す

現在の面談コンテキスト：
- シーン: ${context?.scene || '面談'}
- 目標: ${context?.goal || '効果的な面談の実施'}
- 面談の種類: ${context?.interviewType || '一般的な面談'}
- 関係性: ${context?.interviewRelationship || '上司-部下'}
- 目的: ${context?.interviewPurpose || '評価・指導・相談解決'}
- 文脈: ${context?.interviewContext || '定期面談・問題対応・キャリア相談'}
- 期待される成果: ${context?.interviewOutcomes || '目標の明確化・行動計画の策定'}`;

    if (context?.currentTheory) {
      systemPrompt += `\n- 関連理論: ${context.currentTheory.name_ja || context.currentTheory.name} - ${context.currentTheory.one_liner || context.currentTheory.definition}`;
    }

    if (context?.currentAdvice) {
      systemPrompt += `\n- 関連アドバイス: ${context.currentAdvice.short_advice}`;
    }

    systemPrompt += `\n\nユーザーの面談に関する質問に対して、このコンテキストを活かして具体的で実用的な回答を提供してください。面談の成功に直結する実践的なアドバイスを心がけてください。`;

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

    console.log("Calling OpenAI API for interview with messages:", messages.length);
    
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
    
    console.log("OpenAI interview response received, content length:", content.length);
    
    return content;
  } catch (error) {
    console.error("Interview AI generation error:", error)
    throw error
  }
}

// 面談特化のフォールバック用の回答生成（AI生成に失敗した場合）
function generateInterviewFallbackResponse(message: string, context: any): string {
  const messageLower = message.toLowerCase();
  
  // 基本的なキーワードマッチングによるフォールバック
  if (messageLower.includes('目的') || messageLower.includes('purpose') || messageLower.includes('目標') || messageLower.includes('goal')) {
    return `面談の目的と目標についてお答えします。

現在の面談コンテキストを考慮すると、以下のポイントが重要です：

**面談の目的**: ${context?.interviewPurpose || '評価・指導・相談解決'}
**期待される成果**: ${context?.interviewOutcomes || '目標の明確化・行動計画の策定'}

**効果的な目的設定のポイント**:
1. 面談の目的を明確に伝える
2. 具体的で測定可能な目標を設定する
3. 面談後のフォローアップ計画を策定する

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  if (messageLower.includes('立場') || messageLower.includes('position') || messageLower.includes('関心事') || messageLower.includes('concern')) {
    return `相手の立場と関心事の理解についてお答えします。

**面談の関係性**: ${context?.interviewRelationship || '上司-部下・人事-従業員'}

**相手の立場理解のポイント**:
1. 事前の情報収集を行う
2. 面談中の観察を心がける
3. 共感的な理解を深める

**目標「${context?.goal || '相手の立場と関心事の理解'}」を達成するために**:
- 相手の話を積極的に聞く
- 相手の感情や価値観を尊重する
- 相手の成長を支援する姿勢を持つ

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  // デフォルトのフォールバック回答
  return `申し訳ございません。現在面談AIチャットの応答生成に問題が発生しております。

現在の面談コンテキストについて、基本的なアドバイスとしては：

1. **面談の準備**: 目的と目標を明確にする
2. **相手の理解**: 立場と関心事を把握する
3. **効果的なコミュニケーション**: 積極的傾聴と明確な伝達
4. **信頼関係の構築**: 相手の価値観を尊重する

より詳細で個別化されたアドバイスが必要でしたら、しばらく時間をおいて再度お試しください。`;
}
