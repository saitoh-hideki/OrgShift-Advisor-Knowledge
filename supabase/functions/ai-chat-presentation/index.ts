// プレゼンテーション特化AIチャット機能のエッジファンクション
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
    presentationPurpose?: string;
    audienceType?: string;
    presentationFormat?: string;
    presentationTopics?: string;
    audienceExpertise?: string;
    presentationConstraints?: string;
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
    console.log('Presentation AI Chat function called with method:', req.method);
    
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

    // OpenAI APIを使用してプレゼンテーション特化のAI回答を生成
    let aiResponse = '';
    try {
      aiResponse = await generatePresentationAIResponse(message, context, chatHistory);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      // AI生成に失敗した場合のフォールバック回答
      aiResponse = generatePresentationFallbackResponse(message, context);
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
          scene_type: 'presentation',
          timestamp: new Date().toISOString()
        });
    } catch (saveError) {
      console.log('Failed to save chat history:', saveError);
    }

    console.log('Generated presentation AI response:', aiResponse);
    
    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Presentation AI Chat function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// OpenAI APIを使用してプレゼンテーション特化のAI回答を生成
async function generatePresentationAIResponse(message: string, context: any, chatHistory?: Array<{role: string, content: string}>): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  
  if (!openaiApiKey) {
    console.error("OpenAI API key not configured");
    throw new Error("OpenAI API key not configured")
  }

  try {
    // プレゼンテーション特化のシステムプロンプトの構築
    let systemPrompt = `あなたはプレゼンテーションとコミュニケーションの専門家です。ユーザーのプレゼンテーションに関する質問に対して、以下の点を考慮して具体的で実践的な回答を提供してください：

1. 常に実用的で実行可能なアドバイスを提供する
2. 聴衆の理解と関心を高める手法を示す
3. 効果的なストーリーテリングを促進する
4. 視覚的な要素とコンテンツのバランスを考慮する
5. 緊張や不安への対処法を提供する
6. 具体的な例やステップを示す

現在のプレゼンテーションコンテキスト：
- シーン: ${context?.scene || 'プレゼンテーション'}
- 目標: ${context?.goal || '効果的なプレゼンテーションの実施'}
- 目的: ${context?.presentationPurpose || '情報共有・説得・教育'}
- 聴衆タイプ: ${context?.audienceType || '一般的な聴衆'}
- プレゼンテーション形式: ${context?.presentationFormat || 'スライド・口頭・その他'}
- トピック: ${context?.presentationTopics || 'ビジネス・技術・その他'}
- 聴衆の専門性: ${context?.audienceExpertise || '一般的'}
- 制約: ${context?.presentationConstraints || '時間・場所・その他'}`;

    if (context?.currentTheory) {
      systemPrompt += `\n- 関連理論: ${context.currentTheory.name_ja || context.currentTheory.name} - ${context.currentTheory.one_liner || context.currentTheory.definition}`;
    }

    if (context?.currentAdvice) {
      systemPrompt += `\n- 関連アドバイス: ${context.currentAdvice.short_advice}`;
    }

    systemPrompt += `\n\nユーザーのプレゼンテーションに関する質問に対して、このコンテキストを活かして具体的で実用的な回答を提供してください。プレゼンテーションの成功に直結する実践的なアドバイスを心がけてください。`;

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

    console.log("Calling OpenAI API for presentation with messages:", messages.length);
    
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
    
    console.log("OpenAI presentation response received, content length:", content.length);
    
    return content;
  } catch (error) {
    console.error("Presentation AI generation error:", error)
    throw error
  }
}

// プレゼンテーション特化のフォールバック用の回答生成（AI生成に失敗した場合）
function generatePresentationFallbackResponse(message: string, context: any): string {
  const messageLower = message.toLowerCase();
  
  // 基本的なキーワードマッチングによるフォールバック
  if (messageLower.includes('聴衆') || messageLower.includes('audience') || messageLower.includes('聞き手') || messageLower.includes('参加者')) {
    return `聴衆分析についてお答えします。

現在のプレゼンテーションコンテキストを考慮すると、以下のポイントが重要です：

**聴衆タイプ**: ${context?.audienceType || '一般的な聴衆'}
**聴衆の専門性**: ${context?.audienceExpertise || '一般的'}

**聴衆分析のポイント**:
1. 聴衆の背景と専門性を理解する
2. 聴衆の関心事と期待を把握する
3. 聴衆に合わせた内容と表現を選択する

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  if (messageLower.includes('緊張') || messageLower.includes('不安') || messageLower.includes('nervous') || messageLower.includes('anxiety')) {
    return `プレゼンテーションでの緊張や不安への対処についてお答えします。

**緊張・不安への対処法**:
1. 十分な準備と練習を行う
2. 深呼吸やリラクゼーション技法を活用する
3. 聴衆を味方につける意識を持つ

**目標「${context?.goal || '効果的なプレゼンテーションの実施'}」を達成するために**:
- 自信を持って話す
- 聴衆とのアイコンタクトを心がける
- 自然なジェスチャーを活用する

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  // デフォルトのフォールバック回答
  return `申し訳ございません。現在プレゼンテーションAIチャットの応答生成に問題が発生しております。

現在のプレゼンテーションコンテキストについて、基本的なアドバイスとしては：

1. **聴衆の理解**: 聴衆の背景と関心事を把握する
2. **内容の構成**: 明確で論理的な構成を心がける
3. **表現の工夫**: 視覚的要素と口頭での説明を組み合わせる
4. **練習と準備**: 十分な練習と準備を行う

より詳細で個別化されたアドバイスが必要でしたら、しばらく時間をおいて再度お試しください。`;
}
