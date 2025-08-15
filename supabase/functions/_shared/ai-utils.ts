// AI機能の共通ユーティリティ
export interface AIAdvice {
  theory_id: string;
  theory_name_ja: string;
  short_advice: string;
  expected_effect: string;
  caution: string;
  tips: string;
  related_theory: string;
  implementation_steps: string[];
  success_indicators: string[];
  common_mistakes: string[];
}

export interface AIContext {
  scene: string;
  goal: string;
  timeLimit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
}

// OpenAI APIを使用してAIアドバイスを生成
export async function generateAIAdvice(
  prompt: string,
  context: AIContext
): Promise<AIAdvice[]> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  
  if (!openaiApiKey) {
    console.error("OpenAI API key not configured");
    throw new Error("OpenAI API key not configured")
  }

  try {
    console.log("Calling OpenAI API with prompt length:", prompt.length);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "あなたは組織変革とリーダーシップの専門家です。常に実践的で具体的なアドバイスを提供してください。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
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
    
    // JSONレスポンスを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("Failed to parse AI response, content:", content.substring(0, 200));
      throw new Error("Failed to parse AI response")
    }
    
    const aiResponse = JSON.parse(jsonMatch[0])
    console.log("Parsed AI response structure:", Object.keys(aiResponse));
    
    return aiResponse.advices || []
  } catch (error) {
    console.error("AI generation error:", error)
    throw error
  }
}

// フォールバック用の基本アドバイス生成
export function generateFallbackAdvice(context: AIContext): AIAdvice[] {
  return [
    {
      theory_id: "basic_approach",
      theory_name_ja: "基本的なアプローチ",
      short_advice: "状況に応じて柔軟に対応し、相手の反応を注意深く観察する",
      expected_effect: "基本的な効果的なアプローチが実現できる",
      caution: "状況を無視して機械的に適用しない",
      tips: "相手の反応を見ながら調整する",
      related_theory: "状況適応理論",
      implementation_steps: [
        "1. 状況を正確に把握する",
        "2. 提案されたアプローチを実践する",
        "3. 結果を観察し、必要に応じて調整する"
      ],
      success_indicators: [
        "相手からのポジティブな反応",
        "目標の達成",
        "関係性の改善"
      ],
      common_mistakes: [
        "一方的に押し付ける",
        "状況を無視する",
        "結果を評価しない"
      ]
    }
  ]
}
