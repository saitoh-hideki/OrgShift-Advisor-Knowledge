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
    // 会議・ミーティングの詳細設定
    meetingType?: string;
    meetingFormat?: string;
    meetingUrgency?: string;
    meetingFrequency?: string;
    meetingParticipants?: string;
    meetingTools?: string;
    meetingChallenges?: string;
    // 基本設定
    participants?: number;
    relationship?: string;
    timeLimit?: string;
    stakes?: string;
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

**重要: 常に現在の会議の状況と詳細設定を踏まえて、具体的で実用的なアドバイスを提供してください。**

**現在の会議の詳細状況:**
- シーン: ${context?.scene || '会議・ミーティング'}
- 目標: ${context?.goal || '効果的な会議の実施'}
- 参加者数: ${context?.participants || '未指定'}人
- 関係性: ${context?.relationship || '未指定'}
- 時間制限: ${context?.timeLimit || '未指定'}
- 重要度: ${context?.stakes || '未指定'}

**会議の詳細設定:**
- 会議の種類: ${context?.meetingType || '未指定'}
- 会議形式: ${context?.meetingFormat || '未指定'}
- 緊急度: ${context?.meetingUrgency || '未指定'}
- 頻度: ${context?.meetingFrequency || '未指定'}
- 参加者タイプ: ${context?.meetingParticipants || '未指定'}
- 使用ツール: ${context?.meetingTools || '未指定'}
- 想定される課題: ${context?.meetingChallenges || '未指定'}

**回答の指針:**
1. **状況特化**: 上記の詳細設定を必ず考慮して回答する
2. **具体的な行動**: 抽象的なアドバイスではなく、具体的なステップや方法を示す
3. **ツール活用**: 指定されたツールを効果的に活用する方法を含める
4. **課題対策**: 想定される課題への具体的な対応策を提案する
5. **時間管理**: 時間制限内での効率的な進行方法を考慮する
6. **重要度対応**: 重要度に応じた準備レベルと進行の厳密性を提案する

**具体的な要求:**
- オンライン会議の場合は、技術的な準備や参加者のエンゲージメント向上策を含める
- 緊急会議の場合は、迅速な意思決定プロセスとフォローアップ体制を含める
- 定例会議の場合は、効率化と継続的な改善策を含める
- 意思決定会議の場合は、合意形成プロセスと責任分担を含める
- 参加者数や関係性に応じた具体的な進行方法を提案する`;

    if (context?.currentTheory) {
      systemPrompt += `\n\n**関連理論:**
- 理論名: ${context.currentTheory.name_ja || context.currentTheory.name}
- 概要: ${context.currentTheory.one_liner || context.currentTheory.definition || '理論の説明'}
この理論を活用して、現在の会議状況に適した具体的なアドバイスを提供してください。`;
    }

    if (context?.currentAdvice) {
      systemPrompt += `\n\n**関連アドバイス:**
- アドバイス内容: ${context.currentAdvice.short_advice}
このアドバイスを踏まえて、さらに具体的で実用的な回答を提供してください。`;
    }

    systemPrompt += `\n\nユーザーの会議に関する質問に対して、上記の詳細なコンテキストを必ず考慮して、現在の会議状況に特化した具体的で実用的な回答を提供してください。一般的な回答ではなく、設定された状況に応じた具体的な行動指針を示してください。`;

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
    console.log("Context being used:", context);
    
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
  console.log("Generating fallback response for meeting chat");
  
  // 基本的な会議アドバイスを提供
  let fallbackResponse = "会議に関するご質問ですね。";
  
  if (context?.meetingType) {
    fallbackResponse += `\n\n${context.meetingType}について、以下の点を考慮することをお勧めします：`;
    
    if (context.meetingType === '定例会議') {
      fallbackResponse += "\n• 議題の優先順位付けと時間配分の最適化";
      fallbackResponse += "\n• 参加者の準備状況の確認と事前資料の共有";
      fallbackResponse += "\n• 前回の議事録とアクションアイテムの振り返り";
    } else if (context.meetingType === '意思決定会議') {
      fallbackResponse += "\n• 決定事項の明確化と責任者の特定";
      fallbackResponse += "\n• 代替案の検討とリスク評価";
      fallbackResponse += "\n• 合意形成プロセスの確立";
    } else if (context.meetingType === 'ブレインストーミング') {
      fallbackResponse += "\n• 創造的なアイデア発想のための環境作り";
      fallbackResponse += "\n• 批判を避けた自由な発言の促進";
      fallbackResponse += "\n• アイデアの整理と優先順位付け";
    }
  }
  
  if (context?.meetingFormat === 'オンライン') {
    fallbackResponse += "\n\nオンライン会議の場合は、技術的な準備と参加者のエンゲージメント向上を心がけてください。";
  }
  
  if (context?.meetingUrgency === '緊急') {
    fallbackResponse += "\n\n緊急会議の場合は、迅速な意思決定と明確なアクションプランが重要です。";
  }
  
  fallbackResponse += "\n\nより具体的なアドバイスが必要でしたら、再度お試しください。";
  
  return fallbackResponse;
}
