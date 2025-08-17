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

// OpenAI APIを使用してAIアドバイスを生成（再試行機能付き）
export async function generateAIAdvice(
  prompt: string,
  context: AIContext,
  retryCount: number = 0
): Promise<AIAdvice[]> {
  const maxRetries = 3; // 最大3回まで再試行
  
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  
  if (!openaiApiKey) {
    console.error("OpenAI API key not configured");
    throw new Error("OpenAI API key not configured")
  }

  try {
    console.log(`Calling OpenAI API with prompt length: ${prompt.length} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
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
            content: "あなたは組織変革とリーダーシップの専門家です。常に実践的で具体的なアドバイスを提供してください。必ずJSON形式で回答してください。テキストのみの回答は絶対に受け付けません。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // より一貫性のある回答のため温度を下げる
        max_tokens: 3000, // トークン数を増やして十分な内容を生成
        presence_penalty: 0.1, // 繰り返しを避ける
        frequency_penalty: 0.1 // 多様性を保つ
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      
      // 再試行可能なエラーの場合は再試行
      if (retryCount < maxRetries && (response.status >= 500 || response.status === 429 || response.status === 503)) {
        console.log(`Retrying OpenAI API call (${retryCount + 1}/${maxRetries}) due to status ${response.status}...`);
        // 少し待ってから再試行
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return generateAIAdvice(prompt, context, retryCount + 1);
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    console.log("OpenAI response received, content length:", content.length);
    console.log("Response content preview:", content.substring(0, 300));
    
    // JSONレスポンスを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("Failed to parse AI response, content:", content.substring(0, 500));
      
      // 再試行可能な場合は再試行
      if (retryCount < maxRetries) {
        console.log(`Retrying AI generation due to parsing failure (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return generateAIAdvice(prompt, context, retryCount + 1);
      }
      
      throw new Error("Failed to parse AI response")
    }
    
    const aiResponse = JSON.parse(jsonMatch[0])
    console.log("Parsed AI response structure:", Object.keys(aiResponse));
    
    // レスポンスの構造を検証
    if (!aiResponse.advices || !Array.isArray(aiResponse.advices)) {
      console.warn("AI response missing advices array, attempting to fix...");
      
      // レスポンスの構造を修正しようとする
      if (aiResponse.checklist && Array.isArray(aiResponse.checklist)) {
        console.log("Found checklist in response, converting to advices format");
        return [{
          theory_id: "ai_generated",
          theory_name_ja: "AI生成アドバイス",
          short_advice: "AIが生成したチェックリストに基づくアドバイス",
          expected_effect: "状況に最適化された効果的な実行",
          caution: "状況に応じて適切に調整してください",
          tips: "AIが提案した方法を実践してみてください",
          related_theory: "AI生成理論",
          implementation_steps: ["AIの提案を確認", "状況に応じて調整", "実践と評価"],
          success_indicators: ["目標の達成", "効率の向上", "関係性の改善"],
          common_mistakes: ["機械的な適用", "状況の無視", "評価の省略"]
        }];
      }
      
      // 再試行可能な場合は再試行
      if (retryCount < maxRetries) {
        console.log(`Retrying AI generation due to invalid response structure (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return generateAIAdvice(prompt, context, retryCount + 1);
      }
      
      throw new Error("Invalid AI response structure")
    }
    
    // アドバイスの品質を検証
    if (aiResponse.advices.length === 0) {
      console.warn("AI response has empty advices array, retrying...");
      
      if (retryCount < maxRetries) {
        console.log(`Retrying AI generation due to empty advices (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return generateAIAdvice(prompt, context, retryCount + 1);
      }
    }
    
    return aiResponse.advices || []
  } catch (error) {
    console.error(`AI generation error (attempt ${retryCount + 1}):`, error)
    
    // 再試行可能な場合は再試行
    if (retryCount < maxRetries) {
      console.log(`Retrying AI generation due to error (${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
      return generateAIAdvice(prompt, context, retryCount + 1);
    }
    
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
