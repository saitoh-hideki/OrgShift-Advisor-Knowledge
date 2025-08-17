// 会議特化AIチャット機能のエッジファンクション
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
    meetingType?: string;
    meetingPurpose?: string;
    meetingParticipants?: string;
    meetingDuration?: string;
    meetingFormat?: string;
    meetingConstraints?: string;
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
    console.log('Meeting AI Chat function called with method:', req.method);
    
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

    // OpenAI APIを使用して会議特化のAI回答を生成
    let aiResponse = '';
    try {
      aiResponse = await generateMeetingAIResponse(message, context, chatHistory);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      // AI生成に失敗した場合のフォールバック回答
      aiResponse = generateMeetingFallbackResponse(message, context);
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
          scene_type: 'meeting',
          timestamp: new Date().toISOString()
        });
    } catch (saveError) {
      console.log('Failed to save chat history:', saveError);
    }

    console.log('Generated meeting AI response:', aiResponse);
    
    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Meeting AI Chat function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// OpenAI APIを使用して会議特化のAI回答を生成
async function generateMeetingAIResponse(message: string, context: any, chatHistory?: Array<{role: string, content: string}>): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  
  if (!openaiApiKey) {
    console.error("OpenAI API key not configured");
    throw new Error("OpenAI API key not configured")
  }

  try {
    // 会議特化のシステムプロンプトの構築
    let systemPrompt = `あなたは会議運営とファシリテーションの専門家です。ユーザーの会議に関する質問に対して、以下の点を考慮して具体的で実践的な回答を提供してください：

1. 常に実用的で実行可能なアドバイスを提供する
2. 会議の目的と目標を明確にする
3. 参加者の関与と貢献を最大化する
4. 効率的で効果的な会議運営を促進する
5. 会議後のフォローアップと成果の最大化を支援する
6. 具体的な例やステップを示す

現在の会議コンテキスト：
- シーン: ${context?.scene || '会議'}
- 目標: ${context?.goal || '効果的な会議の実施'}
- 会議タイプ: ${context?.meetingType || '定例会議・プロジェクト会議・意思決定会議'}
- 会議の目的: ${context?.meetingPurpose || '情報共有・意思決定・問題解決・計画策定'}
- 参加者: ${context?.meetingParticipants || '5-10名'}
- 会議時間: ${context?.meetingDuration || '60分'}
- 会議形式: ${context?.meetingFormat || '対面・オンライン・ハイブリッド'}
- 制約: ${context?.meetingConstraints || '時間・参加者・リソース'}`;

    if (context?.currentTheory) {
      systemPrompt += `\n- 関連理論: ${context.currentTheory.name_ja || context.currentTheory.name} - ${context.currentTheory.one_liner || context.currentTheory.definition}`;
    }

    if (context?.currentAdvice) {
      systemPrompt += `\n- 関連アドバイス: ${context.currentAdvice.short_advice}`;
    }

    systemPrompt += `\n\nユーザーの会議に関する質問に対して、このコンテキストを活かして具体的で実用的な回答を提供してください。会議の成功と成果最大化に直結する実践的なアドバイスを心がけてください。`;

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

    console.log("Calling OpenAI API for meeting with messages:", messages.length);
    
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
    
    console.log("OpenAI meeting response received, content length:", content.length);
    
    return content;
  } catch (error) {
    console.error("Meeting AI generation error:", error)
    throw error
  }
}

// 会議特化のフォールバック用の回答生成（AI生成に失敗した場合）
function generateMeetingFallbackResponse(message: string, context: any): string {
  const messageLower = message.toLowerCase();
  
  // 基本的なキーワードマッチングによるフォールバック
  if (messageLower.includes('会議') || messageLower.includes('meeting') || messageLower.includes('進行') || messageLower.includes('facilitation')) {
    return `会議運営についてお答えします。

現在の会議コンテキストを考慮すると、以下のポイントが重要です：

**会議タイプ**: ${context?.meetingType || '定例会議・プロジェクト会議・意思決定会議'}
**会議の目的**: ${context?.meetingPurpose || '情報共有・意思決定・問題解決・計画策定'}

**効果的な会議運営のポイント**:
1. 会議の目的と目標を明確にする
2. 適切な参加者と時間配分を設定する
3. 参加者の関与を促進する

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  if (messageLower.includes('参加者') || messageLower.includes('participant') || messageLower.includes('関与') || messageLower.includes('engagement')) {
    return `会議参加者の関与促進についてお答えします。

**参加者関与促進のポイント**:
1. 全員が発言できる機会を作る
2. 建設的な議論を促進する
3. 参加者の意見を尊重する

**目標「${context?.goal || '効果的な会議の実施'}」を達成するために**:
- 参加者の多様な視点を活用する
- 全員の貢献を認める
- 会議後のアクションを明確にする

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  // デフォルトのフォールバック回答
  return `申し訳ございません。現在会議AIチャットの応答生成に問題が発生しております。

現在の会議コンテキストについて、基本的なアドバイスとしては：

1. **会議設計**: 目的と目標を明確にし、適切な参加者と時間を設定する
2. **会議進行**: 効率的で効果的な会議運営を行い、参加者の関与を促進する
3. **成果最大化**: 会議後のフォローアップとアクションを確実に実行する
4. **継続改善**: 会議の効果を定期的に評価し、改善を図る

より詳細で個別化されたアドバイスが必要でしたら、しばらく時間をおいて再度お試しください。`;
}
