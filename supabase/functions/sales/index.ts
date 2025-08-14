// 営業専用の専門アドバイザー
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, generateFallbackAdvice, type AIAdvice, type AIContext } from "../_shared/ai-utils.ts"

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    const body = await req.json()
    const context: AIContext = {
      scene: body.scene,
      goal: body.goal || "close",
      timeLimit: body.time_limit || "medium",
      stakes: body.stakes || "medium",
      relationship: body.relationship
    }

    const prompt = `あなたは営業心理学と交渉術の専門家で、以下の専門分野に精通しています：
- 営業心理学と顧客行動分析
- ニーズ発見と価値提案の技術
- クロージングと決断促進の手法
- 顧客関係構築と長期的な信頼関係
- 競合分析と差別化戦略
- 営業プロセスの最適化と効率化

【営業状況の詳細分析】
- 目標: ${context.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- 顧客との関係性: ${context.relationship || '未指定'}

【営業フェーズ別専門アドバイス】
以下の3つの具体的で実践的なアドバイスを提供してください：

1. **顧客理解・ニーズ発見段階のアドバイス**
   - 顧客の真のニーズを引き出す質問技術
   - 顧客の心理状態と意思決定要因の分析
   - 顧客の組織内での影響力と決定権の把握

2. **価値提案・ソリューション提示段階のアドバイス**
   - 顧客の課題に最適化された価値提案の構築
   - 競合との差別化ポイントの明確化
   - 顧客のROIとベネフィットの具体的な説明

3. **クロージング・決断促進段階のアドバイス**
   - 顧客の決断を促す心理的テクニック
   - 反対意見への効果的な対応方法
   - 長期的な関係構築のためのクロージング

【各アドバイスの要求事項】
各アドバイスには以下を含めてください：
- 理論名（英語）+ 日本語説明
- 具体的な行動指針（200文字以内）
- 期待される効果（100文字以内）
- 注意点（80文字以内）
- 実践のコツ（100文字以内）
- 関連する理論や研究（50文字以内）
- 実装ステップ（3-5ステップ）
- 成功指標（3-5項目）
- よくある間違い（3-5項目）

【出力形式】
JSON形式で返してください：
{
  "advices": [
    {
      "theory_id": "理論名",
      "theory_name_ja": "日本語理論名",
      "short_advice": "具体的な行動指針",
      "expected_effect": "期待される効果",
      "caution": "注意点",
      "tips": "実践のコツ",
      "related_theory": "関連理論",
      "implementation_steps": ["ステップ1", "ステップ2", "ステップ3"],
      "success_indicators": ["指標1", "指標2", "指標3"],
      "common_mistakes": ["間違い1", "間違い2", "間違い3"]
    }
  ]
}

【専門的な視点】
- 顧客の購買意思決定プロセスの理解
- 顧客の心理的抵抗への対応技術
- 営業の各フェーズでの最適なアプローチ
- 顧客の組織内での影響力の活用
- 長期的な顧客関係の構築と維持
- 営業活動のROI最大化のための戦略`

    let advices: AIAdvice[] = []

    try {
      advices = await generateAIAdvice(prompt, context)
    } catch (aiError) {
      console.error("AI generation failed, using fallback:", aiError)
      advices = generateFallbackAdvice(context)
    }

    return new Response(JSON.stringify({ advices }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
