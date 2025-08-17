// チームビルディング特化AIチャット機能のエッジファンクション
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
    teamSize?: string;
    teamStage?: string;
    teamChallenges?: string;
    teamGoals?: string;
    teamDynamics?: string;
    teamConstraints?: string;
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
    console.log('Team Building AI Chat function called with method:', req.method);
    
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

    // OpenAI APIを使用してチームビルディング特化のAI回答を生成
    let aiResponse = '';
    try {
      aiResponse = await generateTeamBuildingAIResponse(message, context, chatHistory);
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);
      // AI生成に失敗した場合のフォールバック回答
      aiResponse = generateTeamBuildingFallbackResponse(message, context);
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
          scene_type: 'team_building',
          timestamp: new Date().toISOString()
        });
    } catch (saveError) {
      console.log('Failed to save chat history:', saveError);
    }

    console.log('Generated team building AI response:', aiResponse);
    
    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Team Building AI Chat function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// OpenAI APIを使用してチームビルディング特化のAI回答を生成
async function generateTeamBuildingAIResponse(message: string, context: any, chatHistory?: Array<{role: string, content: string}>): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  
  if (!openaiApiKey) {
    console.error("OpenAI API key not configured");
    throw new Error("OpenAI API key not configured")
  }

  try {
    // チームビルディング特化のシステムプロンプトの構築
    let systemPrompt = `あなたはチームビルディングと組織開発の専門家です。ユーザーのチームビルディングに関する質問に対して、以下の点を考慮して具体的で実践的な回答を提供してください：

1. 常に実用的で実行可能なアドバイスを提供する
2. チームの成長段階に応じた適切なアプローチを示す
3. チームメンバーの多様性と個性を活かす方法を提案する
4. 効果的なコミュニケーションとコラボレーションを促進する
5. チームの課題解決と継続的な改善を支援する
6. 具体的な例やステップを示す

現在のチームビルディングコンテキスト：
- シーン: ${context?.scene || 'チームビルディング'}
- 目標: ${context?.goal || '効果的なチームの構築'}
- チームサイズ: ${context?.teamSize || '5-10名'}
- チーム段階: ${context?.teamStage || '形成期・発展期・成熟期'}
- チームの課題: ${context?.teamChallenges || 'コミュニケーション・役割分担・目標共有'}
- チーム目標: ${context?.teamGoals || 'プロジェクト完了・成果向上・関係性改善'}
- チームダイナミクス: ${context?.teamDynamics || '協力的・競争的・個別的'}
- 制約: ${context?.teamConstraints || '時間・予算・リソース'}`;

    if (context?.currentTheory) {
      systemPrompt += `\n- 関連理論: ${context.currentTheory.name_ja || context.currentTheory.name} - ${context.currentTheory.one_liner || context.currentTheory.definition}`;
    }

    if (context?.currentAdvice) {
      systemPrompt += `\n- 関連アドバイス: ${context.currentAdvice.short_advice}`;
    }

    systemPrompt += `\n\nユーザーのチームビルディングに関する質問に対して、このコンテキストを活かして具体的で実用的な回答を提供してください。チームの成功と成長に直結する実践的なアドバイスを心がけてください。`;

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

    console.log("Calling OpenAI API for team building with messages:", messages.length);
    
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
    
    console.log("OpenAI team building response received, content length:", content.length);
    
    return content;
  } catch (error) {
    console.error("Team Building AI generation error:", error)
    throw error
  }
}

// チームビルディング特化のフォールバック用の回答生成（AI生成に失敗した場合）
function generateTeamBuildingFallbackResponse(message: string, context: any): string {
  const messageLower = message.toLowerCase();
  
  // 基本的なキーワードマッチングによるフォールバック
  if (messageLower.includes('チーム') || messageLower.includes('team') || messageLower.includes('メンバー') || messageLower.includes('member')) {
    return `チームビルディングについてお答えします。

現在のチームコンテキストを考慮すると、以下のポイントが重要です：

**チームサイズ**: ${context?.teamSize || '5-10名'}
**チーム段階**: ${context?.teamStage || '形成期・発展期・成熟期'}

**チームビルディングのポイント**:
1. チームの目標とビジョンを明確にする
2. メンバーの役割と責任を明確にする
3. 効果的なコミュニケーションを促進する

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  if (messageLower.includes('コミュニケーション') || messageLower.includes('communication') || messageLower.includes('協力') || messageLower.includes('collaboration')) {
    return `チーム内のコミュニケーションと協力についてお答えします。

**コミュニケーション促進のポイント**:
1. 定期的なミーティングの実施
2. オープンで建設的な対話の促進
3. フィードバックの文化の構築

**目標「${context?.goal || '効果的なチームの構築'}」を達成するために**:
- メンバー間の信頼関係の構築
- 情報共有の仕組みの整備
- チーム活動の継続的な改善

より詳細なアドバイスが必要でしたら、AIチャットが正常に動作するようになった際に再度お試しください。`;
  }
  
  // デフォルトのフォールバック回答
  return `申し訳ございません。現在チームビルディングAIチャットの応答生成に問題が発生しております。

現在のチームビルディングコンテキストについて、基本的なアドバイスとしては：

1. **目標設定**: チームの共通目標とビジョンを明確にする
2. **役割分担**: メンバーの強みを活かした適切な役割分担を行う
3. **コミュニケーション**: 効果的なコミュニケーションと情報共有を促進する
4. **継続改善**: チームの課題を定期的に評価し、改善を図る

より詳細で個別化されたアドバイスが必要でしたら、しばらく時間をおいて再度お試しください。`;
}
